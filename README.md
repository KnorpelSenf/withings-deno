# Withings API Client for Deno

In progress, please come back later.
This will be a library to connect to the Withings API from Deno.

## TODO

- [x] OAuth2 including credentials management
- [x] Getting list of devices (without type safety so far)
- [x] Getting list of goals (without type safety so far)
- [ ] Measure
- [ ] Heart
- [ ] Sleep
- [ ] Notify

## Won't be implemented because I don't need it but PR welcome

- Dropshipment
- Various protected user endpoints that require Withings partnership

## Usage Example

### OAuth2

```ts
import { connect, Credentials, getConnectUrl, UserApi } from "./mod.ts";

const clientId = "...";
const clientSecret = "...";
const redirectUri = "...";

const { url } = getConnectUrl({ clientId, redirectUri });

// Make the user open this URL to authenticate.
console.log(url);

// Withings will then redirect the user to the provided `redirectUri`.
const authorizationCode = "..."; // get the `code` param from that URL

const credentials = await connect({
    clientId,
    clientSecret,
    authorizationCode,
    redirectUri,
});

// Credentials can now be used to create the actual API instances.
// The tokens will refresh automatically.
const userApi = new UserApi(credentials);

const devices = await userApi.getDevices();
console.log(devices);

const goals = await userApi.getGoals();
console.log(goals);

// You can export the token data of the credentials to store it somewhere.
const tokenData = credentials.toTokenData();

// Then obtain an instance of Credentials again from the loaded data.
const c = Credentials.fromTokenData(clientId, clientSecret, tokenData);
```
