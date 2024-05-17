import type {
  Navios,
  NaviosConfig,
  NaviosRequestConfig,
  NaviosResponse,
  PreparedRequestConfig,
} from './types.mjs'

import defaultAdapter from './adapter/native.mjs'
import { createInterceptorManager } from './interceptors/interceptor.manager.mjs'
import { NaviosError } from './NaviosError.mjs'
import { processResponseBody } from './utils/processResponseBody.mjs'

export function create(baseConfig: NaviosConfig = {}): Navios {
  const adapter = baseConfig.adapter ?? defaultAdapter
  const normalizedBaseConfig: Omit<Required<NaviosConfig>, 'adapter'> = {
    baseURL: baseConfig.baseURL ?? '',
    validateStatus:
      baseConfig.validateStatus ??
      ((status: number) => {
        return status >= 200 && status < 300 // default
      }),
    headers: baseConfig.headers ?? {},
    responseType: baseConfig.responseType ?? 'json',
    FormData: baseConfig.FormData ?? FormData,
    URLSearchParams: baseConfig.URLSearchParams ?? URLSearchParams,
  }
  const hooks = createInterceptorManager()

  function tryRecoverFromError(
    err: unknown,
    config: PreparedRequestConfig<any, any>,
    type: 'request' | 'response',
    response: NaviosResponse<any> | null = null,
  ) {
    const error = new NaviosError(
      (err as Error)?.message ?? 'Unknown error',
      response,
      config,
    )
    let isFixed = false
    let result: NaviosError<any> | NaviosResponse<any> = error
    for (const interceptor of hooks.interceptors[type].rejected.values()) {
      if (!isFixed) {
        try {
          result = interceptor(result as NaviosError<any>)
          isFixed = true
          break
        } catch (err) {
          result = err as NaviosError<any>
          result.config = config
        }
      }
    }
    if (!isFixed) {
      throw result
    }
    return result as NaviosResponse<any>
  }

  async function request<
    Result,
    Data = Result,
    Params extends Record<string, string | number> = {},
  >(config: NaviosRequestConfig<Data, Params>) {
    let finalConfig: PreparedRequestConfig<Data, Params> = {
      method: 'GET',
      // @ts-ignore
      params: {},
      ...normalizedBaseConfig,
      ...config,
      headers: {
        ...normalizedBaseConfig.headers,
        ...config.headers,
      },
      url: config.url
        ? `${config.baseURL ?? normalizedBaseConfig.baseURL}${config.url}`
        : config.baseURL ?? normalizedBaseConfig.baseURL,
    }
    for (const interceptor of hooks.interceptors.request.init.values()) {
      finalConfig = await interceptor(finalConfig)
    }
    let res: Response
    try {
      res = await adapter(finalConfig.url, finalConfig)
    } catch (err) {
      return tryRecoverFromError(
        err,
        finalConfig,
        'request',
      ) as NaviosResponse<Result>
    }
    const response: NaviosResponse<Result> = {
      data: await processResponseBody(res, finalConfig),
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    }
    const isSuccessful = finalConfig.validateStatus(response.status)
    if (isSuccessful) {
      for (const interceptor of hooks.interceptors.response.success.values()) {
        await interceptor(response)
      }
      return response as NaviosResponse<Result>
    }
    return tryRecoverFromError(
      new Error(`Request failed with status code ${response.statusText}`),
      finalConfig,
      'response',
      response,
    ) as NaviosResponse<Result>
  }
  return {
    create,
    request,
    get: (url, config) => request({ ...config, url, method: 'GET' }),
    post: (url, data, config) =>
      request({ ...config, url, method: 'POST', data }),
    head: (url, config) => request({ ...config, url, method: 'HEAD' }),
    options: (url, config) => request({ ...config, url, method: 'OPTIONS' }),
    put: (url, data, config) =>
      request({ ...config, url, method: 'PUT', data }),
    patch: (url, data, config) =>
      request({ ...config, url, method: 'PATCH', data }),
    delete: (url, config) => request({ ...config, url, method: 'DELETE' }),
    defaults: normalizedBaseConfig,
    interceptors: hooks,
  }
}
