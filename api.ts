interface Actions {
    oauth2: "requesttoken";
}

const ALL_SCOPES = [
    "user.info",
    "user.metrics",
    "user.activity",
    "user.sleepevents",
] as const;
export type ApiScope = typeof ALL_SCOPES[number];

export interface ApiConfig {
    redirectUri?: string;
    scope?: readonly ApiScope[];
    demo?: boolean;
    onTokenRefreshed?(token: TokenData): Promise<unknown> | unknown;
}

type Not<T> = Partial<Record<keyof T, undefined>>;
export interface ClientData {
    clientId: string;
    clientSecret: string;
}
export interface TokenData {
    accessToken: string;
    refreshToken: string;
    expires: number;
}
export type WithingsCredentials = ClientData & (TokenData | Not<TokenData>);

export class ApiError extends Error {
    public data: unknown;
    constructor(message: string, data: unknown) {
        super(message);
        this.name = "ApiError";
        this.data = data;
    }
}

export class Api {
    public readonly BASE_URL = "https://wbsapi.withings.net/v2";

    public credentials: WithingsCredentials;
    public config?: ApiConfig;

    constructor(
        credentials: ClientData | WithingsCredentials,
        config?: ApiConfig,
    ) {
        this.credentials = credentials;
        this.config = config;
    }

    async callApi<M extends keyof Actions, A extends Actions[M]>(
        method: M,
        action: A,
        parameters: Record<string, unknown>,
    ) {
        const formData = Object
            .values({ action, ...parameters })
            .reduce((fd, [k, v]) => (fd.append(k, v), fd), new FormData());
        const url = `${this.BASE_URL}/${method}`;
        const token = await this.getBearer();
        const response = await fetch(url, {
            headers: token === undefined
                ? {}
                : { "Authorization": `Bearer ${token}` },
            body: formData,
        });
        const json = await response.json();
        const { status, body } = json;
        if (status !== 0) {
            throw new ApiError(
                `Call to /${method} with action ${action} failed with status code ${status}`,
                { parameters, response: json },
            );
        }
        return body;
    }

    async getBearer() {
        let creds = this.credentials;
        if (creds.accessToken === undefined) return undefined;
        if (creds.expires < Date.now()) creds = await this.refreshToken();
        return creds.accessToken;
    }

    getConnectUrl(token = crypto.randomUUID()) {
        if (this.config?.redirectUri === undefined) {
            throw new Error("You must pass a redirect URL to connect!");
        }
        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.credentials.clientId,
            redirect_uri: this.config.redirectUri,
            scope: (this.config?.scope ?? ALL_SCOPES).join(),
            ...(this.config.demo ? { mode: "demo" } : {}),
            state: token,
        });
        const url =
            `https://account.withings.com/oauth2_user/authorize2?${params.toString()}`;
        return { url, token: token };
    }

    async connect(authorizationCode: string): Promise<WithingsCredentials> {
        if (this.config?.redirectUri === undefined) {
            throw new Error("You must pass a redirect URL to connect!");
        }
        const { clientId, clientSecret } = this.credentials;
        const { redirectUri } = this.config;
        const {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn, // seconds
        } = await this.callApi("oauth2", "requesttoken", {
            grant_type: "authorization_code",
            client_id: clientId,
            client_secret: clientSecret,
            code: authorizationCode,
            redirect_uri: redirectUri,
        });
        const expires = Date.now() + 1000 * expiresIn; // milliseconds
        return { clientId, clientSecret, accessToken, refreshToken, expires };
    }

    async refreshToken() {
        const creds = this.credentials;
        if (creds.refreshToken === undefined) {
            throw new Error("Cannot refresh before authenticating!");
        }
        const {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn,
        } = await this.callApi("oauth2", "requesttoken", {
            grant_type: "refresh_token",
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
            refresh_token: creds.refreshToken,
        });
        const expires = Date.now() + 1000 * expiresIn;
        const token: TokenData = { accessToken, refreshToken, expires };
        this.credentials = { ...creds, ...token };
        await this.config?.onTokenRefreshed?.(token);
        return this.credentials;
    }
}
