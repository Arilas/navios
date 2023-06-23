import type { NaviosConfig, Navios, NaviosRequestConfig, NaviosResponse, NaviosError, NaviosStatic } from './types.mjs'
import defaultAdapter from './adapter/native.mjs'
import { createInterceptorManager } from './interceptors/interceptor.manager.mjs'

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
      res = await adapter (finalConfig.url, {
        ...finalConfig,
        body: finalConfig.body ?? typeof finalConfig.data === 'object' ? finalConfig.data instanceof FormData ? finalConfig.data : JSON.stringify(finalConfig.data) : finalConfig.data as any
      })
    } catch (err) {
      const error = new Error(
        // @ts-ignore
        (err || {})?.message as string,
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
      data:
        finalConfig.responseType === 'text'
          ? await res.text()
          : await res.json(),
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
    const error = new Error(response.statusText) as NaviosError<Result>
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
const navios = create()

// Default methods
export const get = navios.get
export const post = navios.post
export const head = navios.head
export const options = navios.options
export const put = navios.put
export const patch = navios.patch
export const del = navios.delete


// @ts-ignore This is a hack to make the default handler work as a function and as an object
const defaultHandler: NaviosStatic = navios.request

defaultHandler.create = create
for (const method of ['get', 'post', 'head', 'options', 'put', 'patch', 'delete']) {
  // @ts-ignore
  defaultHandler[method] = navios[method]
}

export default defaultHandler
