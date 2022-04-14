export const BASE_URL = "https://wbsapi.withings.net/v2";
export const AUTH_URL = "https://account.withings.com/oauth2_user/authorize2";

export const ALL_SCOPES = [
    "user.info",
    "user.metrics",
    "user.activity",
    "user.sleepevents",
] as const;
export type ApiScope = typeof ALL_SCOPES[number];
