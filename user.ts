import { AbstractApi, Credentials } from "./api.ts";

export interface Device {
    type:
        | "Scale"
        | "Babyphone"
        | "Blood Pressure Monitor"
        | "Activity Tracker"
        | "Sleep Monitor"
        | "Smart Connected Thermometer"
        | "Gateway";
    model: string;
    model_id: number;
    battery: string;
    deviceid: string;
    hash_deviceid: string;
    timezone: string;
    last_session_date: number;
}

export interface Goal {
    steps: number;
    sleep: number;
    weight: Weight;
}

export interface Weight {
    value: number;
    unit: number;
}

export class UserApi extends AbstractApi {
    constructor(credentials: Credentials) {
        super(credentials);
    }

    async getDevices(): Promise<Device[]> {
        const { devices } = await this.call("user", "getdevice");
        return devices;
    }

    async getGoals(): Promise<Goal[]> {
        const { goals } = await this.call("user", "getgoals");
        return goals;
    }
}
