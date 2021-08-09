// eslint-disable-next-line @typescript-eslint/no-unused-vars
import homebridge from 'homebridge';

declare type Username = string;
declare type Password = string;
declare type ClientSecret = string;

declare module 'homebridge' {
  export interface AccessoryConfig {
    clientSecret: ClientSecret;
    username: Username;
    password: Password;
  }
}

export const enum WorkModes {
  Off = 'PowerOff',
  Manual = 'Manual',
  Auto = 'Auto',
}

export const enum ConnectionState {
  Connected = 'Connected',
  Disconnected = 'Disconnected',
}

interface Appliance {
  pncId: string;
  name: string;
  modelName: string;
  firmwareVersion: string;
  workMode: WorkModes;
  filterRFID: string;
  filterLife: number;
  fanSpeed: number;
  UILight: boolean;
  safetyLock: boolean;
  ionizer: boolean;
  sleep?: boolean;
  scheduler?: boolean;
  filterType: number;
  version: number;
  pm1: number;
  pm25: number;
  pm10: number;
  tvoc: number;
  co2: number;
  temp: number;
  humidity: number;
  envLightLevel?: number;
  rssi: number;
}

declare namespace WellbeingApi {
  export interface Appliance {
    applianceName: string;
    created: string;
    id: number;
    modelName: string;
    timeZoneStandardName: string;
    pncId: string;
    domainId: number;
  }

  export interface ApplianceData {
    pncId: string;
    applianceData: ApplianceDataData;
    twin: Twin;
    telemetry: null;
  }

  export interface ApplianceDataData {
    applianceName: string;
    created: string;
    modelName: string;
    pncId: string;
  }

  export interface Twin {
    deviceId: string;
    properties: Properties;
    status: string;
    connectionState: ConnectionState;
  }

  export interface Properties {
    desired: Desired;
    reported: Reported;
  }

  export interface Desired {
    TimeZoneStandardName: string;
    LocationReq: boolean;
    FrmVer_NIU: string;
    $metadata: DesiredMetadata;
    $version: number;
  }

  export interface DesiredMetadata {
    $lastUpdated: string;
    $lastUpdatedVersion: number;
    TimeZoneStandardName: LastUpdatedWithVersion;
    LocationReq: LastUpdatedWithVersion;
    FrmVer_NIU: LastUpdatedWithVersion;
  }

  export interface LastUpdatedWithVersion {
    $lastUpdated: string;
    $lastUpdatedVersion: number;
  }

  export interface Reported {
    FrmVer_NIU: string;
    Workmode: WorkModes;
    FilterRFID: string;
    FilterLife: number;
    Fanspeed: number;
    UILight: boolean;
    SafetyLock: boolean;
    Ionizer: boolean;
    Sleep?: boolean;
    Scheduler?: boolean;
    FilterType: number;
    DspIcoTVOC: boolean;
    ErrPM2_5: boolean;
    ErrTVOC: boolean;
    ErrTempHumidity: boolean;
    ErrFanMtr: boolean;
    ErrCommSensorDisplayBrd: boolean;
    DoorOpen: boolean;
    ErrRFID: boolean;
    SignalStrength: string;
    $metadata: ReportedMetadata;
    $version: number;
    deviceId: string;
    TVOC: number;
    CO2: number;
    PM1: number;
    PM2_5: number;
    PM10: number;
    Humidity: number;
    Temp: number;
    RSSI: number;
    EnvLightLvl?: number;
  }

  export interface ReportedMetadata {
    $lastUpdated: string;
    FrmVer_NIU: LastUpdated;
    Workmode: LastUpdated;
    FilterRFID: LastUpdated;
    FilterLife: LastUpdated;
    Fanspeed: LastUpdated;
    UILight: LastUpdated;
    SafetyLock: LastUpdated;
    Ionizer: LastUpdated;
    Sleep?: LastUpdated;
    Scheduler?: LastUpdated;
    FilterType: LastUpdated;
    DspIcoTVOC: LastUpdated;
    ErrPM2_5: LastUpdated;
    ErrTVOC: LastUpdated;
    ErrTempHumidity: LastUpdated;
    ErrFanMtr: LastUpdated;
    ErrCommSensorDisplayBrd: LastUpdated;
    DoorOpen: LastUpdated;
    ErrRFID: LastUpdated;
    SignalStrength: LastUpdated;
    TVOC: LastUpdated;
    CO2: LastUpdated;
    PM1: LastUpdated;
    PM2_5: LastUpdated;
    PM10: LastUpdated;
    Humidity: LastUpdated;
    Temp: LastUpdated;
    RSSI: LastUpdated;
    EnvLightLvl?: LastUpdated;
  }

  export interface LastUpdated {
    $lastUpdated: string;
  }
}
