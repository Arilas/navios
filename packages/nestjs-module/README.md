# Navios NestJs Module

`axios` replacement for Angular with `axios` API based on native fetch implementation.

## Why?

`axios` is a great library, but it has some issues:

- It's not using native `fetch` API, so it's slow and buggy on backend
- It's not supporting Next.JS caching mechanism

## Installation

```bash
npm install --save @navios/nestjs-module
```

or

```bash
yarn add @navios/nestjs-module
```

## Integration in Module

```ts
import { Module } from '@nestjs/common';
import { NaviosModule } from '@navios/nestjs-module';


@Module({
  imports: [
    NaviosModule.register({
      baseURL: 'https://example.com/',
    }),
    //...
  ],
  //...
})
```

## Usage

```ts
import { Inject, Injectable } from '@nestjs/core'
import type { NaviosError, NaviosService } from '@navios/angular-module'

@Injectable({})
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
