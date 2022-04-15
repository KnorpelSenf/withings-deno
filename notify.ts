import { AbstractApi, Credentials } from "./api.ts";

export interface Notification {
    appli: number;
    callbackurl: string;
    comment: string;
}

export interface NotificationProfile extends Notification {
    expires: number;
}

export class NotiryApi extends AbstractApi {
    constructor(credentials: Credentials) {
        super(credentials);
    }

    async get(parameters: {
        callbackurl: string;
        appli?: number;
    }): Promise<Notification> {
        return await this.call("notify", "get", parameters);
    }

    async list(parameters: {
        appli?: number;
    }): Promise<NotificationProfile> {
        const { profiles } = await this.call("notify", "list", parameters);
        return profiles;
    }

    async revoke(parameters: {
        callbackurl?: string;
        appli?: number;
    }) {
        await this.call("notify", "revoke", parameters);
    }

    async subscribe(parameters: {
        callbackurl: string;
        appli: number;
        comment?: string;
    }) {
        await this.call("notify", "subscribe", parameters);
    }

    async update(
        parameters:
            & { callbackurl: string; appli: number }
            & (
                | { new_callbackurl: string }
                | { new_appli: number }
                | { comment: string }
            ),
    ) {
        await this.call("notify", "subscribe", parameters);
    }
}
