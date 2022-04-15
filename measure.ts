import { AbstractApi, Credentials } from "./api.ts";

export interface Measure {
    updatetime: string;
    timezone: string;
    measuregrps: MeasureGroup[];
    more: number;
    offset: number;
}

export interface MeasureGroup {
    grpid: number;
    attrib: number;
    date: number;
    created: number;
    category: number;
    deviceid: string;
    measures: MeasurePoint[];
    timezone: string;
}

export interface MeasurePoint {
    value: number;
    type: number;
    unit: number;
}

export class MeasureApi extends AbstractApi {
    constructor(credentials: Credentials) {
        super(credentials);
    }

    async getMeasure(parameters: {
        type: number | number[];
        category: 1 | 2;
        startdate?: number;
        enddate?: number;
        offset?: number;
        lastupdate?: number;
    }): Promise<Measure> {
        const params = {
            ...(Array.isArray(parameters.type)
                ? { meastypes: parameters.type.join() }
                : { meastype: parameters.type }),
            category: parameters.category,
            startdate: parameters.startdate,
            enddate: parameters.enddate,
            lastupdate: parameters.lastupdate,
            offset: parameters.offset,
        };
        return await this.call("measure", "getmeas", params);
    }

    async *streamMeasures(parameters: Parameters<this["getMeasure"]>[0]) {
        do {
            const {
                measuregrps,
                more,
                offset,
            } = await this.getMeasure(parameters);
            yield* measuregrps;
            parameters.offset = more > 0 ? offset : undefined;
        } while (parameters.offset !== undefined);
    }

    getActivity() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }

    *streamActivity() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }

    getIntraDayActivity() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }

    getWorkouts() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }

    *streamWorkouts() {
        // TODO: implement
        throw new Error("Not implemented yet, please open a PR");
    }
}
