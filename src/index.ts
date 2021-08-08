import _ from 'lodash';
import {
  API,
  APIEvent,
  DynamicPlatformPlugin,
  HAP,
  Logging,
  CharacteristicSetCallback,
  CharacteristicEventTypes,
  CharacteristicValue,
  PlatformAccessory,
  PlatformAccessoryEvent,
  PlatformConfig,
} from 'homebridge';
import { AxiosInstance } from 'axios';

import { createClient } from './api';
import { Appliance, WorkModes } from './types';

const PLUGIN_NAME = 'electrolux-wellbeing';
const PLATFORM_NAME = 'ElectroluxWellbeing';

// Pure A9 fans support speeds from [1, 9].
const FAN_SPEED_MULTIPLIER = 100 / 9;

let hap: HAP, Service, Characteristic;
let Accessory: typeof PlatformAccessory;

export = (api: API) => {
  hap = api.hap;
  Accessory = api.platformAccessory;
  Service = hap.Service;
  Characteristic = hap.Characteristic;
  api.registerPlatform(PLATFORM_NAME, ElectroluxWellbeingPlatform);
};

class ElectroluxWellbeingPlatform implements DynamicPlatformPlugin {
  private client?: AxiosInstance;
  private readonly log: Logging;
  private readonly api: API;
  private readonly config: PlatformConfig;
  private readonly accessories: PlatformAccessory[] = [];

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;
    this.config = config;

    api.on(APIEvent.DID_FINISH_LAUNCHING, async () => {
      if (this.needsConfiguration()) {
        this.log('Please configure this plugin first.');
        return;
      }

      //this.removeAccessories();

      try {
        this.client = await createClient({
          username: this.config.username,
          password: this.config.password,
        });
      } catch (err) {
        this.log.debug('Error while creating client', err);
        return;
      }

      const appliances = await this.getAllAppliances();
      const applianceData = await Promise.all(
        appliances.map((appliance) => this.fetchApplianceData(appliance.pncId)),
      );

      this.log.debug('Fetched: ', applianceData);

      appliances.map(({ applianceName, modelName, pncId }, i) => {
        this.addAccessory({
          pncId,
          name: applianceName,
          modelName,
          firmwareVersion: applianceData[i]?.firmwareVersion,
        });
      });

      this.updateValues(applianceData);
      setInterval(
        () => this.checkAppliances(),
        this.getPollTime(this.config.pollTime),
      );
    });
  }

  needsConfiguration(): boolean {
    return !this.config.username || !this.config.password;
  }

  getPollTime(pollTime): number {
    if (!pollTime || pollTime < 5) {
      this.log.info('Set poll time is below 5s, forcing 5s');
      return 5 * 1000;
    }

    this.log.debug(`Refreshing every ${pollTime}s`);
    return pollTime * 1000;
  }

  async checkAppliances() {
    const data = await this.fetchAppliancesData();

    this.log.debug('Fetched: ', data);
    this.updateValues(data);
  }

  async fetchAppliancesData() {
    return await Promise.all(
      this.accessories.map((accessory) =>
        this.fetchApplianceData(accessory.context.pncId),
      ),
    );
  }

  async fetchApplianceData(pncId: string) {
    try {
      const response = await this.client!.get(`/Appliances/${pncId}`);
      const {
        twin: {
          properties: { reported },
        },
      } = response.data;

      return {
        pncId,
        name: response.data.applianceData.applianceName,
        modelName: response.data.applianceData.modelName,
        firmwareVersion: reported.FrmVer_NIU,
        workMode: reported.Workmode,
        filterRFID: reported.FilterRFID,
        filterLife: reported.FilterLife,
        fanSpeed: reported.Fanspeed,
        UILight: reported.UILight,
        safetyLock: reported.SafetyLock,
        ionizer: reported.Ionizer,
        sleep: reported.Sleep,
        scheduler: reported.Scheduler,
        filterType: reported.FilterType,
        version: reported['$version'],
        pm1: reported.PM1,
        pm25: reported.PM2_5,
        pm10: reported.PM10,
        tvoc: reported.TVOC,
        co2: reported.CO2,
        temp: reported.Temp,
        humidity: reported.Humidity,
        envLightLevel: reported.EnvLightLvl,
        rssi: reported.RSSI,
      };
    } catch (err) {
      this.log.info('Could not fetch appliances data: ' + err);
    }
  }

  async getAllAppliances() {
    try {
      const response = await this.client!.get('/Domains/Appliances');
      return _.get(response, 'data', []);
    } catch (err) {
      this.log.info('Could not fetch appliances: ' + err);
      return [];
    }
  }

  async sendCommand(
    pncId: string,
    command: string,
    value: CharacteristicValue,
  ) {
    this.log.debug('sending command', {
      [command]: value,
    });

    try {
      const response = await this.client!.put(`/Appliances/${pncId}/Commands`, {
        [command]: value,
      });
      this.log.debug('command responded', response.data);
    } catch (err) {
      this.log.info('Could run command', err);
    }
  }

  updateValues(data) {
    this.accessories.map((accessory) => {
      const { pncId } = accessory.context;
      const state = this.getApplianceState(pncId, data);

      // Keep firmware revision up-to-date in case the device is updated.
      accessory
        .getService(Service.AccessoryInformation)!
        .setCharacteristic(
          Characteristic.FirmwareRevision,
          state.firmwareVersion,
        );

      accessory
        .getService(Service.TemperatureSensor)!
        .updateCharacteristic(Characteristic.CurrentTemperature, state.temp);

      accessory
        .getService(Service.HumiditySensor)!
        .updateCharacteristic(
          Characteristic.CurrentRelativeHumidity,
          state.humidity,
        );

      accessory
        .getService(Service.CarbonDioxideSensor)!
        .updateCharacteristic(Characteristic.CarbonDioxideLevel, state.co2);

      // Env Light Level needs to be tested with lux meter
      accessory
        .getService(Service.LightSensor)!
        .updateCharacteristic(
          Characteristic.CurrentAmbientLightLevel,
          state.envLightLevel,
        );

      accessory
        .getService(Service.AirQualitySensor)!
        .updateCharacteristic(
          Characteristic.AirQuality,
          this.getAirQualityLevel(state.pm25),
        )
        .updateCharacteristic(Characteristic.PM2_5Density, state.pm25)
        .updateCharacteristic(Characteristic.PM10Density, state.pm10)
        .updateCharacteristic(Characteristic.VOCDensity, state.tvoc);

      accessory
        .getService(Service.AirPurifier)!
        .updateCharacteristic(Characteristic.FilterLifeLevel, state.filterLife)
        .updateCharacteristic(
          Characteristic.FilterChangeIndication,
          parseInt(state.filterLife) < 10
            ? Characteristic.FilterChangeIndication.CHANGE_FILTER
            : Characteristic.FilterChangeIndication.FILTER_OK,
        )
        .updateCharacteristic(
          Characteristic.Active,
          state.workMode !== WorkModes.Off,
        )
        .updateCharacteristic(
          Characteristic.CurrentAirPurifierState,
          this.getAirPurifierState(state.workMode),
        )
        .updateCharacteristic(
          Characteristic.TargetAirPurifierState,
          this.getAirPurifierStateTarget(state.workMode),
        )
        .updateCharacteristic(
          Characteristic.RotationSpeed,
          state.fanSpeed * FAN_SPEED_MULTIPLIER,
        )
        .updateCharacteristic(
          Characteristic.LockPhysicalControls,
          state.safetyLock,
        )
        .updateCharacteristic(Characteristic.SwingMode, state.ionizer);
    });
  }

  getApplianceState(pncId: string, data): Appliance {
    return _.find(data, { pncId });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.log('Configuring accessory %s', accessory.displayName);

    const { pncId } = accessory.context;

    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log('%s identified!', accessory.displayName);
    });

    accessory
      .getService(Service.AirPurifier)!
      .getCharacteristic(Characteristic.Active)
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          const workMode = value === 1 ? WorkModes.Auto : WorkModes.Off;

          if (
            accessory
              .getService(Service.AirPurifier)!
              .getCharacteristic(Characteristic.Active).value !== value
          ) {
            this.sendCommand(pncId, 'WorkMode', workMode);
            this.log.info(
              '%s AirPurifier Active was set to: ' + workMode,
              accessory.displayName,
            );
          }

          callback();
        },
      );

    accessory
      .getService(Service.AirPurifier)!
      .getCharacteristic(Characteristic.TargetAirPurifierState)
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          const workMode =
            value === Characteristic.TargetAirPurifierState.MANUAL
              ? WorkModes.Manual
              : WorkModes.Auto;
          this.sendCommand(pncId, 'WorkMode', workMode);
          this.log.info(
            '%s AirPurifier Work Mode was set to: ' + workMode,
            accessory.displayName,
          );
          callback();
        },
      );

    accessory
      .getService(Service.AirPurifier)!
      .getCharacteristic(Characteristic.RotationSpeed)
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          const fanSpeed = Math.floor(
            parseInt(value.toString()) / FAN_SPEED_MULTIPLIER,
          );
          this.sendCommand(pncId, 'FanSpeed', fanSpeed);

          this.log.info(
            '%s AirPurifier Fan Speed set to: ' + fanSpeed,
            accessory.displayName,
          );
          callback();
        },
      );

    accessory
      .getService(Service.AirPurifier)!
      .getCharacteristic(Characteristic.LockPhysicalControls)
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          this.sendCommand(pncId, 'SafetyLock', value);

          this.log.info(
            '%s AirPurifier Saftey Lock set to: ' + value,
            accessory.displayName,
          );
          callback();
        },
      );

    accessory
      .getService(Service.AirPurifier)!
      .getCharacteristic(Characteristic.SwingMode)
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          this.sendCommand(pncId, 'Ionizer', value);

          this.log.info(
            '%s AirPurifier Ionizer set to: ' + value,
            accessory.displayName,
          );
          callback();
        },
      );

    this.accessories.push(accessory);
  }

  addAccessory({ name, modelName, pncId, firmwareVersion }) {
    const uuid = hap.uuid.generate(pncId);

    if (!this.isAccessoryRegistered(name, uuid)) {
      this.log.info('Adding new accessory with name %s', name);
      const accessory = new Accessory(name, uuid);

      accessory.context.pncId = pncId;

      accessory.addService(Service.AirPurifier);
      accessory.addService(Service.AirQualitySensor);
      accessory.addService(Service.TemperatureSensor);
      accessory.addService(Service.CarbonDioxideSensor);
      accessory.addService(Service.HumiditySensor);
      accessory.addService(Service.LightSensor);

      accessory
        .getService(Service.AccessoryInformation)!
        .setCharacteristic(Characteristic.Manufacturer, 'Electrolux')
        .setCharacteristic(Characteristic.Model, modelName)
        .setCharacteristic(Characteristic.SerialNumber, pncId)
        .setCharacteristic(Characteristic.FirmwareRevision, firmwareVersion);

      this.configureAccessory(accessory);

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
    } else {
      this.log.info(
        'Accessory name %s already added, loading from cache ',
        name,
      );
    }
  }

  removeAccessories() {
    this.log.info('Removing all accessories');

    this.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      this.accessories,
    );
    this.accessories.splice(0, this.accessories.length);
  }

  isAccessoryRegistered(name: string, uuid: string) {
    return !!_.find(this.accessories, { UUID: uuid });
  }

  getAirQualityLevel(pm25: number): number {
    switch (true) {
      case pm25 < 6:
        return Characteristic.AirQuality.EXCELLENT;
      case pm25 < 12:
        return Characteristic.AirQuality.GOOD;
      case pm25 < 36:
        return Characteristic.AirQuality.FAIR;
      case pm25 < 50:
        return Characteristic.AirQuality.INFERIOR;
      case pm25 >= 50:
        return Characteristic.AirQuality.POOR;
    }

    return Characteristic.AirQuality.UNKNOWN;
  }

  getAirPurifierState(workMode: WorkModes): number {
    if (workMode !== WorkModes.Off) {
      return Characteristic.CurrentAirPurifierState.PURIFYING_AIR;
    }

    return Characteristic.CurrentAirPurifierState.INACTIVE;
  }

  getAirPurifierStateTarget(workMode: WorkModes): number {
    if (workMode === WorkModes.Auto) {
      return Characteristic.TargetAirPurifierState.AUTO;
    }

    return Characteristic.TargetAirPurifierState.MANUAL;
  }
}
