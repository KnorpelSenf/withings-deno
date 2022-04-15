import { AbstractApi, Credentials } from "./api.ts";

export class SleepApi extends AbstractApi {
    constructor(credentials: Credentials) {
        super(credentials);
    }

    get() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }

    getSummary() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }
}
