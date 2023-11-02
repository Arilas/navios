# Navios Angular Module

`axios` replacement for Angular with `axios` API based on native fetch implementation.

## Why?

`axios` is a great library, but it has some issues:

- It's not using native `fetch` API, so it's slow and buggy on backend
- It's not supporting Next.JS caching mechanism

## Installation

```bash
npm install --save @navios/angular-module
```

or

```bash
yarn add @navios/angular-module
```

## Integration app.config.ts

```ts
import { NaviosModule } from '@navios/angular-module'

export const appConfig: ApplicationConfig = {
  providers: [
    //...
    NaviosModule.provideNavios({
      baseURL: 'https://example.com/',
    }),
    //...
  ],
}
```

## Usage

```ts
import { Inject, Injectable } from '@angular/core'
import type { NaviosError, NaviosService } from '@navios/angular-module'

@Injectable({
  providedIn: 'root',
})
export class SomeService {
  constructor(@Inject(NaviosService) private readonly navios: NaviosService) {}

  async load(uri, urlParams) {
    const response = await this.navios.get<MyResponse>(uri, {
      params: urlParams,
    })

    //...
  }
}
```
