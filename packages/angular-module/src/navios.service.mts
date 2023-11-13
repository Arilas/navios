import navios, {
  type NaviosDeleteConfig,
  type NaviosGetConfig,
  type NaviosPatchConfig,
  type NaviosPutConfig,
  type NaviosRequestConfig,
  type NaviosResponse,
  type Navios,
} from 'navios'

import { Injectable, inject } from '@angular/core'
import { NaviosInjectionToken } from './navios.constants.mjs'

@Injectable()
export class NaviosService {
  protected readonly instance: Navios = inject(NaviosInjectionToken)

  request<T = any, Data = T, Params extends object = object>(
    config: NaviosRequestConfig<Data, Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.request<T, Data>(config)
  }

  get<T = any, Params extends object = object>(
    url: string,
    config?: NaviosGetConfig<Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.get(url, config)
  }

  delete<T = any, Params extends object = object>(
    url: string,
    config?: NaviosDeleteConfig<Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.delete(url, config)
  }

  post<T = any, Data = T, Params extends object = object>(
    url: string,
    data?: any,
    config?: NaviosRequestConfig<Data, Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.post(url, data, config)
  }

  put<T = any, Data = T, Params extends object = object>(
    url: string,
    data?: any,
    config?: NaviosPutConfig<Data, Params>,
  ): Promise<NaviosResponse<T>> {
    return this.instance.put(url, data, config)
  }

  patch<T = any, Data = T, Params extends object = object>(
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
