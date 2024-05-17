import type { HttpMethod, Navios, NaviosRequestConfig } from 'navios'
import type { AnyZodObject, z } from 'zod'

import { NaviosError } from 'navios'

import type {
  DeclareAPIConfig,
  EndpointConfig,
  EndpointResponseSchema,
  EndpointWithDataConfig,
  NaviosZodRequest,
} from './types.mjs'

export function declareAPI(config: DeclareAPIConfig = {}) {
  let client: Navios | null = null

  function declareEndpoint<
    Config extends EndpointConfig | EndpointWithDataConfig,
  >(options: Config) {
    const { method, url, responseSchema } = options
    return async (
      request: NaviosZodRequest<Config> = {} as NaviosZodRequest<Config>,
    ): Promise<z.infer<EndpointResponseSchema<Config>>> => {
      if (!client) {
        throw new Error('client was not provided')
      }
      if (options.querySchema && !('params' in request)) {
        throw new Error('params is required')
      }
      if ('requestSchema' in options && !('data' in request)) {
        throw new Error('data is required')
      }

      const finalUrlPart = bindUrlParams(url, request)
      try {
        const result = await client.request({
          ...request,
          params:
            'params' in request && options.querySchema
              ? options.querySchema.parse(request.params)
              : {},
          method,
          url: finalUrlPart,
          data:
            'requestSchema' in options && 'data' in request
              ? options.requestSchema.parse(request.data)
              : undefined,
        })
        if (config.useWholeResponse) {
          return responseSchema.parse(result)
        }
        return responseSchema.parse(result.data)
      } catch (error) {
        if (!config.useDiscriminatorResponse) {
          throw error
        }
        if (error instanceof NaviosError && error.response) {
          if (config.useWholeResponse) {
            return responseSchema.parse(error.response)
          }
          return responseSchema.parse(error.response.data)
        }
        throw error
      }
    }
  }

  function makeMethodCreator<Method extends HttpMethod>(method: Method) {
    type Config = Method extends 'POST' | 'PUT' | 'PATCH'
      ? Omit<EndpointWithDataConfig, 'requestSchema'> & {
          requestSchema?: AnyZodObject
        }
      : EndpointConfig

    return (options: NoInfer<Omit<Config, 'method'>>) => {
      // @ts-expect-error TS2345. We know that the Config type is correct
      return declareEndpoint<Config>({
        method,
        ...options,
      })
    }
  }

  function provideClient(newClient: Navios) {
    client = newClient
  }

  function getClient() {
    if (!client) {
      throw new Error('client was not provided')
    }
    return client
  }

  return {
    get: makeMethodCreator('GET'),
    post: makeMethodCreator('POST'),
    put: makeMethodCreator('PUT'),
    delete: makeMethodCreator('DELETE'),
    patch: makeMethodCreator('PATCH'),
    head: makeMethodCreator('HEAD'),
    options: makeMethodCreator('OPTIONS'),
    declareEndpoint,
    provideClient,
    getClient,
  }
}
function bindUrlParams(
  urlPart: string,
  params: Omit<NaviosRequestConfig<any, {}>, 'method' | 'url' | 'data'> & {
    urlParams?: Record<string, string> | undefined
  } & ({} | { data: { [x: string]: any } }),
) {
  const urlParams = urlPart.match(/$([a-zA-Z0-9]+)/g)
  let finalUrl = urlPart
  if (urlParams && params.urlParams) {
    for (const param of urlParams) {
      if (param in params) {
        finalUrl = finalUrl.replace(`$${param}`, params.urlParams[param])
      } else {
        throw new Error(`Missing parameter ${param}`)
      }
    }
  }
  return finalUrl
}
