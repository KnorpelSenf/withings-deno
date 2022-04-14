import { AbstractApi, Credentials } from "./api.ts";

export interface Device {
    type: string;
    // TODO: add remaining
}

export interface Goal {
    steps: number;
    // TODO: add remaining
}

export class UserApi extends AbstractApi {
    constructor(credentials: Credentials) {
        super(credentials);
    }

    async getDevices(): Promise<Device[]> {
        const { devices } = await this.call("user", "getdevice");
        return devices;
    }

    async getGoals() {
        return await this.call("user", "getgoals");
    }
}
