import { ALL_SCOPES, type ApiScope, AUTH_URL, BASE_URL } from "./constants.ts";

interface Actions {
    oauth2: "requesttoken";
    user: "getdevice" | "getgoals";
    measure: "getmeas" | "getactivity" | "getintradayactivity" | "getworkouts";
    heart: "get" | "list";
    sleep: "get" | "getsummary";
    notify: "get" | "list" | "revoke" | "subscribe" | "update";
}

export class ApiError extends Error {
    public data: unknown;
    constructor(message: string, data: unknown) {
        super(message);
        this.name = "ApiError";
        this.data = data;
    }
}

export abstract class AbstractApi {
    constructor(private readonly credentials: Credentials) {}
    protected async call<M extends keyof Actions, A extends Actions[M]>(
        method: M,
        action: A,
        parameters?: Record<string, unknown>,
    ) {
        return await callApi(method, action, parameters, this.credentials);
    }
}

async function getBearer(creds?: Credentials) {
    if (creds?.accessToken === undefined) return undefined;
    if (creds.expires < Date.now()) await refreshToken(creds);
    return creds.accessToken;
}

async function refreshToken(creds: Credentials) {
    const {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
    } = await callApi("oauth2", "requesttoken", {
        grant_type: "refresh_token",
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        refresh_token: creds.refreshToken,
    });
    const expires = Date.now() + 1000 * expiresIn;
    creds.accessToken = accessToken;
    creds.refreshToken = refreshToken;
    creds.expires = expires;
    creds.fireRefresh();
    return creds;
}

export async function callApi<M extends keyof Actions, A extends Actions[M]>(
    method: M,
    action: A,
    parameters?: Record<string, unknown>,
    credentials?: Credentials,
) {
    const formData = Object
        .entries({ action, ...parameters })
        .filter(([, v]) => v != null)
        .reduce((fd, [k, v]) => (fd.append(k, v), fd), new FormData());
    const url = `${BASE_URL}/${method}`;
    const token = await getBearer(credentials);
    const response = await fetch(url, {
        method: "POST",
        headers: token === undefined
            ? {}
            : { "Authorization": `Bearer ${token}` },
        body: formData,
    });
    const json = await response.json();
    const { status, body, error } = json;
    if (status !== 0) {
        throw new ApiError(
            `Call to /${method} with action ${action} failed with status ${status}: ${error}`,
            { parameters, response: json },
        );
    }
    return body;
}

export type RefreshListener = (data: Credentials) => unknown | Promise<unknown>;

export interface TokenData {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expires: number;
}

export class Credentials {
    private listeners: RefreshListener[] = [];

    constructor(
        public readonly clientId: string,
        public readonly clientSecret: string,
        public userId: string,
        public accessToken: string,
        public refreshToken: string,
        public expires: number,
    ) {}

    toTokenData(): TokenData {
        return {
            userId: this.userId,
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            expires: this.expires,
        };
    }
    static fromTokenData(
        clientId: string,
        clientSecret: string,
        tokenData: TokenData,
    ) {
        return new Credentials(
            clientId,
            clientSecret,
            tokenData.userId,
            tokenData.accessToken,
            tokenData.refreshToken,
            tokenData.expires,
        );
    }

    on(_eventName: "refresh", listener: RefreshListener) {
        this.off(listener);
        this.listeners.push(listener);
    }
    off(listener: RefreshListener) {
        this.listeners = this.listeners.filter((l) => l === listener);
    }
    fireRefresh() {
        this.listeners.forEach((listener) => listener(this));
    }
}

export interface ConnectUrlParams {
    clientId: string;
    redirectUri: string;
    scope?: ApiScope[];
    demo?: boolean;
    state?: string;
}

export function getConnectUrl(config: ConnectUrlParams) {
    const {
        clientId,
        redirectUri,
        scope = ALL_SCOPES,
        demo = false,
        state = crypto.randomUUID(),
    } = config;
    const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scope.join(),
        ...(demo ? { mode: "demo" } : {}),
        state,
    });
    const url = `${AUTH_URL}?${params.toString()}`;
    return { url, state };
}

export interface ConnectConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authorizationCode: string;
}

export async function connect(config: ConnectConfig) {
    const { clientId, clientSecret, redirectUri, authorizationCode } = config;
    const {
        userid: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn, // seconds
    } = await callApi(`oauth2`, "requesttoken", {
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: authorizationCode,
        redirect_uri: redirectUri,
    });
    const expires = Date.now() + 1000 * expiresIn; // milliseconds
    return new Credentials(
        clientId,
        clientSecret,
        userId,
        accessToken,
        refreshToken,
        expires,
    );
}
