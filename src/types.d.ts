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
    Auto = 'Auto'
}


interface Appliance {
    pncId: string;
    name: string;
    modelName: string;
    firmwareVersion: string;
    workMode: WorkModes;
    filterRFID: string;
    filterLife: string;
    fanSpeed: number;
    UILight: boolean;
    safetyLock: boolean;
    ionizer: boolean;
    sleep: boolean;
    scheduler: boolean;
    filterType: number;
    version: string;
    pm1: number;
    pm25: number;
    pm10: number;
    tvoc: number;
    co2: number;
    temp: number;
    humidity: number;
    envLightLevel: number;
    rssi: number;
}