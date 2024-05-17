import type { DynamicModule, Provider } from '@nestjs/common'

import navios from 'navios'

import { Module } from '@nestjs/common'
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util.js'

import type {
  HttpModuleAsyncOptions,
  HttpModuleOptions,
  HttpModuleOptionsFactory,
} from './interfaces/navios-module.interface.mjs'

import {
  NAVIOS_INSTANCE_TOKEN,
  NAVIOS_MODULE_ID,
  NAVIOS_MODULE_OPTIONS,
} from './navios.constants.mjs'
import { NaviosService } from './navios.service.mjs'

@Module({
  providers: [
    NaviosService,
    {
      provide: NAVIOS_INSTANCE_TOKEN,
      useValue: navios,
    },
  ],
  exports: [NaviosService],
})
export class NaviosModule {
  static register(config: HttpModuleOptions): DynamicModule {
    return {
      module: NaviosModule,
      providers: [
        {
          provide: NAVIOS_INSTANCE_TOKEN,
          useValue: this.crateClient(config),
        },
        {
          provide: NAVIOS_MODULE_ID,
          useValue: randomStringGenerator(),
        },
      ],
    }
  }

  static registerAsync(options: HttpModuleAsyncOptions): DynamicModule {
    return {
      module: NaviosModule,
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: NAVIOS_INSTANCE_TOKEN,
          useFactory: (config: HttpModuleOptions) => this.crateClient(config),
          inject: [NAVIOS_MODULE_OPTIONS],
        },
        {
          provide: NAVIOS_MODULE_ID,
          useValue: randomStringGenerator(),
        },
        ...(options.extraProviders || []),
      ],
    }
  }

  private static crateClient(config: HttpModuleOptions) {
    const { interceptors = {}, ...naviosConfig } = config
    const { request = [], response = [] } = interceptors
    const client = navios.create(naviosConfig)
    request.forEach((interceptor) =>
      client.interceptors.request.use(
        // @ts-ignore
        ...interceptor.map((fn) => (arg: any) => fn(arg, client)),
      ),
    )
    response.forEach((interceptor) =>
      client.interceptors.response.use(
        // @ts-ignore
        ...interceptor.map((fn) => (arg: any) => fn(arg, client)),
      ),
    )
    return client
  }

  private static createAsyncProviders(
    options: HttpModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }
    if (options.useClass) {
      return [
        this.createAsyncOptionsProvider(options),
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ]
    }
    throw new Error('Invalid HttpModule async options')
  }

  private static createAsyncOptionsProvider(
    options: HttpModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: NAVIOS_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }
    if (options.useExisting || options.useClass) {
      return {
        provide: NAVIOS_MODULE_OPTIONS,
        useFactory: async (optionsFactory: HttpModuleOptionsFactory) =>
          optionsFactory.createHttpOptions(),
        // @ts-ignore
        inject: [options.useExisting || options.useClass],
      }
    }
    throw new Error('Invalid HttpModule async options')
  }
}
