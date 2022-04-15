# Withings API Client for Deno

This is a library to connect to [the Withings API](https://developer.withings.com/api-reference).

## Support

- [x] OAuth2 including credentials management
- [x] Getting list of devices
- [x] Getting list of goals
- [x] Measure (partial support)
- [ ] Heart
- [ ] Sleep
- [x] Notify
- [ ] Dropshipment

Adding support for the remaining endpoints is absolutely trivial, please submit a PR.
I just did not need it, so I did not bother :)

Various protected user endpoints that require Withings partnership are not implemented, either, as well as support for signatures and nonces.

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

let credentials = await connect({
    clientId,
    clientSecret,
    authorizationCode,
    redirectUri,
});

// You can export the token data of the credentials to store it somewhere.
const tokenData = credentials.toTokenData();

// Then obtain an instance of Credentials again from the loaded data.
credentials = Credentials.fromTokenData(clientId, clientSecret, tokenData);

// The tokens will refresh automatically if expired.
// You can listen for these events on your credentials objects.

// Define listener
function credentialsRefreshed(creds: Credentials) {
    console.log(creds, "updated");
}

// Register listener
credentials.on("refresh", credentialsRefreshed);
// Unregister listener
credentials.off(credentialsRefreshed);

// Credentials can be used to create the actual API instances.
// You can create as many instances as you like from the same credentials.
const userApi = new UserApi(credentials);

const devices = await userApi.getDevices();
console.log(devices);
```

### Measures

You can use your credentials to create an instance of `MeasureApi`.

#### Creating an API instance

```ts
import { MeasureApi } from "./mod.ts";

// Create API instance
const measureApi = new MeasureApi(credentials);
```

#### API calls and Pagination

All regular API methods are simply available as methods, see below.

Some of these methods support pagination via `offset` and `more`.
This library allows you to iterate through the pages automatically using asynchronous iterators.
That way, you don't have to care about the individual pages, but can rather process a stream of measures, while the library will dynamically request more data as needed.

```ts
const params = { category: 1 as const, type: [1, 4, 9, 10], lastupdate: 0 };

// Call regular API methods
const measure = await measureApi.getMeasure(params);
console.log(measure);

// Call API methods with pagination
for await (const m of measureApi.streamMeasures(params)) {
    console.log(m);
}
```

### Other APIs

All other APIs work exactly the same way as illustrated above.
They are called:

- `UserApi`
- `MeasureApi`
- `HeartApi`
- `SleepApi`
- `NotifyApi`

Check out [the API reference](https://doc.deno.land/https://deno.land/x/withings/mod.ts).
