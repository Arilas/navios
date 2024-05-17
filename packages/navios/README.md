# Navios

Drop-in minimalistic `axios` replacement based on a native `fetch`.

## Why?

`axios` is a great library, but it has some issues:

- It's quite big
- It's using old `XMLHttpRequest` API on browser and `http` on Node.js which brings some inconsistencies
- It's slow on Node.js
- It's not supporting Next.JS caching mechanism, because it's not using `fetch`

## Installation

```bash
npm install --save navios
```

or

```bash
yarn add navios
```

## Basic Usage

```js
import navios from 'navios'

navios.get('https://example.com').then((response) => {
  console.log(response.data)
})
```

## Usage with interceptors

```ts
import { create } from 'navios'

const client = create({
  baseURL: 'https://example.com/api/',
  headers: {
    'X-Custom-Header': 'foobar',
  },
})

client.interceptors.request.use((config) => {
  console.log('Request to', config.url)
  return config
})

client.interceptors.response.use(
  (response) => {
    console.log('Response from', response.config.url)
    return response
  },
  (error) => {
    console.error('Error from', error.config.url)
    if (error.response.status === 401) {
      console.error('Unauthorized')
    }
    return Promise.reject(error)
  },
)

client.get('users').then((response) => {
  console.log(response.data)
})
```

## API

### `create(config)`

Creates a new instance of `navios` with a custom configuration.

#### `config`

- `baseURL` - Base URL for requests
- `headers` - Default headers
- `responseType` - Default response type: `json`, `text`, `blob`, `arrayBuffer`, `formData`, `stream`
- `validateStatus` - Custom function to validate status code
- `adapter` - Custom adapter function, like `fetch` from `undici`
- `FormData` - Custom `FormData` implementation
- `URLSearchParams` - Custom `URLSearchParams` implementation

### `client.request(requestConfig)`

Make a request with custom configuration.

#### `requestConfig`

- `url` - URL for the request (will be combined with `baseURL`)
- `method` - HTTP method
- `headers` - Custom headers
- `params` - URL search parameters (will be appended to the URL), can be an object or `URLSearchParams`
- `data` - Request body, can be an object or `FormData`
- `responseType` - Response type: `json`, `text`, `blob`, `arrayBuffer`, `formData`, `stream`
- `validateStatus` - Custom function to validate status code
- `baseURL` - Base URL for the request, overrides the instance `baseURL`
- `credentials` - Request credentials: `omit`, `same-origin`, `include`
- `cancelToken` - AbortSignal to cancel the request

Plus other `fetch` RequestInit options.

### `client.get(url[, config])`

Make a `GET` request.

### `client.delete(url[, config])`

Make a `DELETE` request.

### `client.head(url[, config])`

Make a `HEAD` request.

### `client.options(url[, config])`

Make a `OPTIONS` request.

### `client.post(url[, data[, config]])`

Make a `POST` request.

### `client.put(url[, data[, config]])`

Make a `PUT` request.

### `client.patch(url[, data[, config]])`

Make a `PATCH` request.

### `client.defaults`

Default configuration for the client. Can be modified to affect all requests, like change default headers.

### `client.interceptors`

Interceptors for requests and responses.

#### `client.interceptors.request.use(onFulfilled[, onRejected])`

Add a request interceptor.

#### `client.interceptors.response.use(onFulfilled[, onRejected])`

Add a response interceptor.
