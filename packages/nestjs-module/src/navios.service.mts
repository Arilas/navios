import type {
  Navios,
  NaviosDeleteConfig,
  NaviosGetConfig,
  NaviosHeadConfig,
  NaviosPatchConfig,
  NaviosPostConfig,
  NaviosPutConfig,
  NaviosRequestConfig,
  NaviosResponse,
} from 'navios'

import navios from 'navios'

import { Inject } from '@nestjs/common'

import { NAVIOS_INSTANCE_TOKEN } from './navios.constants.mjs'

export class NaviosService {
  constructor(
    @Inject(NAVIOS_INSTANCE_TOKEN)
    protected readonly instance: Navios = navios,
  ) {}

  request<T = any, Data = T, Params extends {} = {}>(
    config: NaviosRequestConfig<Data, Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.request<T, Data>(config)
  }

  get<T = any, Params extends {} = {}>(
    url: string,
    config?: NaviosGetConfig<Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.get(url, config)
  }

  delete<T = any, Params extends {} = {}>(
    url: string,
    config?: NaviosDeleteConfig<Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.delete(url, config)
  }

  head<T = any, Params extends {} = {}>(
    url: string,
    config?: NaviosHeadConfig<Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.head(url, config)
  }

  post<T = any, Data = T, Params extends {} = {}>(
    url: string,
    data?: any,
    config?: NaviosPostConfig<Data, Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.post(url, data, config)
  }

  put<T = any, Data = T, Params extends {} = {}>(
    url: string,
    data?: any,
    config?: NaviosPutConfig<Data, Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.put(url, data, config)
  }

  patch<T = any, Data = T, Params extends {} = {}>(
    url: string,
    data?: any,
    config?: NaviosPatchConfig<Data, Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.patch(url, data, config)
  }

  get naviosRef(): Navios {
    return this.instance
  }
}
