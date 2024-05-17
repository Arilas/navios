import type {
  Navios,
  NaviosConfig,
  NaviosRequestConfig,
  NaviosResponse,
} from './types.mjs'

import defaultAdapter from './adapter/native.mjs'
import { createInterceptorManager } from './interceptors/interceptor.manager.mjs'
import { NaviosError } from './NaviosError.mjs'
import { processResponseBody } from './utils/processResponseBody.mjs'

export function create(baseConfig: NaviosConfig = {}): Navios {
  const adapter = baseConfig.adapter || defaultAdapter
  const normalizedBaseConfig = {
    baseURL: baseConfig.baseURL || '',
    validateStatus: (status: number) => {
      return status >= 200 && status < 300 // default
    },
    headers: baseConfig.headers || {},
    responseType: baseConfig.responseType || 'json',
  }
  const hooks = createInterceptorManager()

  async function request<Result, Data = Result, Params extends {} = {}>(
    config: NaviosRequestConfig<Data, Params>,
  ) {
    let finalConfig: Required<NaviosRequestConfig<Data, Params>> = {
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
      res = await adapter(finalConfig.url, {
        ...finalConfig,
        body:
          finalConfig.body ?? typeof finalConfig.data === 'object'
            ? finalConfig.data instanceof FormData
              ? finalConfig.data
              : JSON.stringify(finalConfig.data)
            : (finalConfig.data as any),
      })
    } catch (err) {
      const error = new NaviosError(
        // @ts-ignore TODO: fix this
        (err || {})?.message as string,
        {} as NaviosResponse<Result>,
        finalConfig,
      ) as NaviosError<Result>
      error.config = finalConfig
      let isFixed = false
      let result: NaviosError<Result> | NaviosResponse<Result> = error
      for (const interceptor of hooks.interceptors.request.rejected.values()) {
        if (!isFixed) {
          try {
            result = await interceptor(result as NaviosError<Result>)
            isFixed = true
            break
          } catch (err) {
            result = err as NaviosError<Result>
            result.config = finalConfig
          }
        }
      }
      if (!isFixed) {
        throw result
      }
      return result as NaviosResponse<Result>
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
    const error = new NaviosError(response.statusText, response, finalConfig)
    error.response = response
    error.config = finalConfig

    let result: NaviosError<Result> | NaviosResponse<Result> = error
    let isFixed = false
    for (const interceptor of hooks.interceptors.response.rejected.values()) {
      if (!isFixed) {
        try {
          result = await interceptor(result as NaviosError<Result>)
          isFixed = true
          break
        } catch (err) {
          result = err as NaviosError<Result>
          result.config = finalConfig
        }
      }
    }
    if (!isFixed) {
      throw result
    }
    return result as NaviosResponse<Result>
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
