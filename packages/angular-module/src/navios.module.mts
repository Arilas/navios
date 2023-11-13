import navios from 'navios'

import type { HttpModuleOptions } from './interfaces/navios-module.interface.mjs'
import { NAVIOS_INSTANCE_TOKEN } from './navios.constants.mjs'
import { NaviosService } from './navios.service.mjs'
import {
  type EnvironmentProviders,
  type ModuleWithProviders,
  NgModule,
  makeEnvironmentProviders,
} from '@angular/core'

@NgModule({
  providers: [
    NaviosService,
    {
      provide: NAVIOS_INSTANCE_TOKEN,
      useValue: navios,
    },
  ],
})
export class NaviosModule {
  static register(
    config: HttpModuleOptions,
  ): ModuleWithProviders<NaviosModule> {
    return {
      ngModule: NaviosModule,
      providers: [
        {
          provide: NAVIOS_INSTANCE_TOKEN,
          useValue: this.crateClient(config),
        },
      ],
    }
  }

  static provideNavios(config: HttpModuleOptions): EnvironmentProviders {
    return makeEnvironmentProviders([
      {
        provide: NAVIOS_INSTANCE_TOKEN,
        useValue: this.crateClient(config),
      },
      NaviosService,
    ])
  }

  private static crateClient(config: HttpModuleOptions) {
    const { interceptors = {}, ...naviosConfig } = config
    const { request = [], response = [] } = interceptors
    const client = navios.create(naviosConfig)
    request.forEach((interceptor) =>
      client.interceptors.request.use(
        // @ts-ignore it's ok
        ...interceptor.map((fn) => (arg: any) => fn(arg, client)),
      ),
    )
    response.forEach((interceptor) =>
      client.interceptors.response.use(
        // @ts-ignore it's ok
        ...interceptor.map((fn) => (arg: any) => fn(arg, client)),
      ),
    )
    return client
  }
}
