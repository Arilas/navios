import type { ModuleMetadata, Provider, Type } from '@nestjs/common'

import type {
  Navios,
  NaviosConfig,
  NaviosError,
  NaviosRequestConfig,
  NaviosResponse,
} from 'navios'

export type HttpModuleOptions = NaviosConfig & {
  interceptors?: {
    request?: [
      onInit: (onInit: NaviosRequestConfig<any, any>, client: Navios) => any,
      onRejected?: (config: NaviosError<any>, client: Navios) => any,
    ][]
    response?: [
      onSuccess: (response: NaviosResponse<any>, client: Navios) => any,
      onRejected?: (error: NaviosError<any>, client: Navios) => any,
    ][]
  }
}

export interface HttpModuleOptionsFactory {
  createHttpOptions(): Promise<HttpModuleOptions> | HttpModuleOptions
}

export interface HttpModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<HttpModuleOptionsFactory>
  useClass?: Type<HttpModuleOptionsFactory>
  useFactory?: (
    ...args: any[]
  ) => Promise<HttpModuleOptions> | HttpModuleOptions
  inject?: any[]
  extraProviders?: Provider[]
}
