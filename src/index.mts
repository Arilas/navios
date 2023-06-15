export interface NaviosResponse<T> {
  data: T
  status: number
  statusText: string
  headers: any
}

export interface NaviosError<T> extends Error {
  response: NaviosResponse<T>
  config: NaviosRequestConfig<any, any>
}

export interface NaviosConfig {
  baseURL?: string
  validateStatus?: (status: number) => boolean
  headers?: { [key: string]: string }
}
export interface NaviosRequestConfig<Data, Params extends {}>
  extends RequestInit {
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  baseURL?: string
  headers?: any
  params?: Params
  data?: Data
  credentials?: RequestCredentials
  responseType?: 'json' | 'text'
  validateStatus?: (status: number) => boolean
  cancelToken?: AbortSignal
}

export type NaviosGetConfig<Params extends {}> = Omit<
  NaviosRequestConfig<void, Params>,
  'method' | 'data' | 'url'
>
export type NaviosPostConfig<Data, Params extends {}> = Omit<
  NaviosRequestConfig<Data, Params>,
  'method' | 'url'
>
export type NaviosPutConfig<Data, Params extends {}> = Omit<
  NaviosRequestConfig<Data, Params>,
  'method' | 'url'
>
export type NaviosDeleteConfig<Params extends {}> = Omit<
  NaviosRequestConfig<void, Params>,
  'method' | 'data' | 'url'
>
export type NaviosPatchConfig<Data, Params extends {}> = Omit<
  NaviosRequestConfig<Data, Params>,
  'method' | 'url'
>

export interface Navios {
  create: (baseConfig?: NaviosConfig) => Navios
  get: <Result, Params extends {} = {}>(
    url: string,
    config?: NaviosGetConfig<Params>,
  ) => Promise<NaviosResponse<Result>>
  post: <Result, Data = Result, Params extends {} = {}>(
    url: string,
    data?: any,
    config?: NaviosPostConfig<Data, Params>,
  ) => Promise<NaviosResponse<Result>>
  put: <Result, Data = Result, Params extends {} = {}>(
    url: string,
    data?: any,
    config?: NaviosPutConfig<Data, Params>,
  ) => Promise<NaviosResponse<Result>>
  delete: <Result, Params extends {} = {}>(
    url: string,
    config?: NaviosDeleteConfig<Params>,
  ) => Promise<NaviosResponse<Result>>
  patch: <Result, Data = Result, Params extends {} = {}>(
    url: string,
    data?: any,
    config?: NaviosPatchConfig<Data, Params>,
  ) => Promise<NaviosResponse<Result>>
  request: <Result, Data = Result, Params extends {} = {}>(
    config: NaviosRequestConfig<Data, Params>,
  ) => Promise<NaviosResponse<Result>>
  defaults: NaviosConfig
  interceptors: {
    request: {
      use: (
        onInit: (onInit: NaviosRequestConfig<any, any>) => any,
        onRejected?: (config: NaviosError<any>) => any,
      ) => number
      eject: (id: number) => void
      clear: () => void
    }
    response: {
      use: (
        onSuccess: (response: NaviosResponse<any>) => any,
        onRejected?: (error: NaviosError<any>) => any,
      ) => number
      eject: (id: number) => void
      clear: () => void
    }
  }
}

export function create(baseConfig: NaviosConfig = {}): Navios {
  const normalizedBaseConfig = {
    baseURL: baseConfig.baseURL || '',
    validateStatus: (status: number) => {
      return status >= 200 && status < 300 // default
    },
    headers: baseConfig.headers || {},
  }
  let id = 0
  const initRequestInterceptors: Map<
    string,
    (config: Required<NaviosRequestConfig<any, any>>) => any
  > = new Map([['params-init', paramsInterceptor]])
  const successResponseInterceptors: Map<
    string,
    (response: NaviosResponse<any>) => any
  > = new Map()
  const rejectedRequestInterceptors: Map<
    string,
    (response: NaviosError<any>) => any
  > = new Map()
  const rejectedResponseInterceptors: Map<
    string,
    (response: NaviosError<any>) => any
  > = new Map()

  const interceptors = {
    request: {
      use: (
        handler: (onInit: NaviosRequestConfig<any, any>) => any,
        onRejected?: (config: NaviosError<any>) => any,
      ) => {
        id++
        initRequestInterceptors.set(`${id}-init`, handler)
        if (onRejected) {
          rejectedRequestInterceptors.set(`${id}-rejected`, onRejected)
        }
        return id
      },
      eject: (id: number) => {
        initRequestInterceptors.delete(`${id}-init`)
        rejectedRequestInterceptors.delete(`${id}-rejected`)
      },
      clear: () => {
        initRequestInterceptors.clear()
        rejectedRequestInterceptors.clear()
      },
    },
    response: {
      use: (
        onSuccess: (response: NaviosResponse<any>) => any,
        onReject?: (response: NaviosError<any>) => any,
      ) => {
        id++
        successResponseInterceptors.set(`${id}-success`, onSuccess)
        if (onReject) {
          rejectedResponseInterceptors.set(`${id}-reject`, onReject)
        }

        return id
      },
      eject: (id: number) => {
        successResponseInterceptors.delete(`${id}-success`)
        rejectedResponseInterceptors.delete(`${id}-reject`)
      },
      clear: () => {
        successResponseInterceptors.clear()
        rejectedResponseInterceptors.clear()
      },
    },
  }
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
    for (const interceptor of initRequestInterceptors.values()) {
      finalConfig = await interceptor(finalConfig)
    }
    let res: Response
    try {
      res = await fetch(finalConfig.url, {
        ...finalConfig,
      })
    } catch (err) {
      const error = new Error(
        // @ts-ignore
        (err || {})?.message as string,
      ) as NaviosError<Result>
      error.config = finalConfig
      let isFixed = false
      let result: NaviosError<Result> | NaviosResponse<Result> = error
      for (const interceptor of rejectedRequestInterceptors.values()) {
        if (!isFixed) {
          try {
            result = await interceptor(result as NaviosError<Result>)
            isFixed = true
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
      for (const interceptor of successResponseInterceptors.values()) {
        await interceptor(response)
      }
      return response as NaviosResponse<Result>
    }
    const error = new Error(response.statusText) as NaviosError<Result>
    error.response = response
    error.config = finalConfig

    let result: NaviosError<Result> | NaviosResponse<Result> = error
    let isFixed = false
    for (const interceptor of rejectedResponseInterceptors.values()) {
      if (!isFixed) {
        try {
          result = await interceptor(result as NaviosError<Result>)
          isFixed = true
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
    put: (url, data, config) =>
      request({ ...config, url, method: 'PUT', data }),
    patch: (url, data, config) =>
      request({ ...config, url, method: 'PATCH', data }),
    delete: (url, config) => request({ ...config, url, method: 'DELETE' }),
    defaults: normalizedBaseConfig,
    interceptors,
  }
}

function paramsInterceptor(config: Required<NaviosRequestConfig<any, any>>) {
  if (config.params && !config.url.includes('?')) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(config.params)) {
      if (value == null) continue
      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, item)
        }
        continue
      }
      if (typeof value === 'object') {
        params.append(key, JSON.stringify(value))
        continue
      }
      // @ts-ignore
      params.append(key, value)
    }
    const search = params.toString()
    if (search.length > 0) {
      config.url = `${config.url}?${search}`
    }
  }
  return config
}

export default create()
