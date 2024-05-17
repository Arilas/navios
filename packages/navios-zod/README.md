# Navios Zod API

`Navios Zod` is a simple wrapper around `zod` library to provide a more convenient way to work with `zod` schemas.

## Why?

Developers forget to use `zod` to check the data before using it. This can lead to unexpected errors in the application. `Navios Zod` provides a simple way to check the data before using it.

You cannot trust that API will return the data in the format you expect. `Navios Zod` provides a simple way to check the data before using it.

## Installation

```bash
npm install --save @navios/navios-zod zod navios
```

or

```bash
yarn add @navios/navios-zod zod navios
```

## Usage

```ts
import { z } from 'zod'
import { createAPI } from '@navios/navios-zod'

const API = createAPI({
  baseURL: 'https://example.com/api/',
})

const GetUserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
})

const getUser = API.get('user', GetUserResponseSchema)
```

Or more complex example with request schema:

```ts
import { z } from 'zod'
import { createAPI } from '@navios/navios-zod'
import { GetUsersResponseSchema } from './schemas/GetUsersResponseSchema.js'

const API = createAPI({
  baseURL: 'https://example.com/api/',
})

const UpdateUserRequestSchema = z.object({
  id: z.number(),
  name: z.string(),
})

const updateUser = API.put(
  'user/$userId',
  UpdateUserRequestSchema,
  GetUsersResponseSchema,
)

const users = await updateUser({
  urlParams: {
    userId: 1,
  },
  data: {
    id: 1,
    name: 'John Doe',
  },
})
```
