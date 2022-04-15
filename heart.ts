import { AbstractApi, Credentials } from "./api.ts";

export class HeartApi extends AbstractApi {
    constructor(credentials: Credentials) {
        super(credentials);
    }

    get() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }

    list() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }

    *stream() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }
}
