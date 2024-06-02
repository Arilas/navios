import type {
  HttpMethod,
  Navios,
  NaviosRequestConfig,
  NaviosResponse,
} from 'navios'
import type { AnyZodObject, z } from 'zod'

import { NaviosError } from 'navios'

import type {
  BlobEndpointConfig,
  DeclareAPIConfig,
  Endpoint,
  EndpointConfig,
  EndpointResponseSchema,
  EndpointWithDataConfig,
  NaviosZodRequest,
  UrlHasParams,
  UrlParams,
} from './types.mjs'

export function declareAPI(config: DeclareAPIConfig = {}) {
  let client: Navios | null = null

  function declareEndpoint<
    Config extends EndpointConfig | EndpointWithDataConfig,
  >(options: Config): Endpoint<Config> {
    const { method, url, responseSchema } = options
    // @ts-expect-error TS2322 We declare the correct type. Here is a stub
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

      const finalUrlPart = bindUrlParams<Config['url']>(url, request)
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

  function declareBlobEndpoint(options: BlobEndpointConfig) {
    const { method, url, download } = options
    return async (
      request: NaviosZodRequest<BlobEndpointConfig>,
    ): Promise<NaviosResponse<Blob>> => {
      if (!client) {
        throw new Error('client was not provided')
      }
      if (options.querySchema && !('params' in request)) {
        throw new Error('params is required')
      }

      const finalUrlPart = bindUrlParams<BlobEndpointConfig['url']>(
        url,
        request,
      )
      try {
        const result = await client.request<Blob>({
          ...request,
          params:
            'params' in request && options.querySchema
              ? options.querySchema.parse(request.params)
              : {},
          method,
          url: finalUrlPart,
          responseType: 'blob',
        })
        if (!download) {
          return result
        }
        var blobUrl = window.URL.createObjectURL(result.data)
        var a = document.createElement('a')
        a.href = blobUrl
        a.download = request.fileName
        document.body.appendChild(a) // we need to append the element to the dom -> otherwise it will not work in firefox
        a.click()
        a.remove() //afterwards we remove the element again
        return result
      } catch (error) {
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
    declareBlobEndpoint,
    provideClient,
    getClient,
  }
}

function bindUrlParams<Url extends string>(
  urlPart: Url,
  params: Omit<NaviosRequestConfig<any, {}>, 'method' | 'url' | 'data'> &
    (UrlHasParams<Url> extends true
      ? {
          urlParams: UrlParams<Url>
        }
      : {}) &
    ({} | { data: { [x: string]: any } }),
) {
  const placement = /\$([a-zA-Z0-9]+)/g
  const match = urlPart.matchAll(placement)
  // @ts-expect-error TS2551 We checked the line before
  if (match && params.urlParams) {
    return Array.from(match)
      .map(([, group]) => group)
      .reduce(
        (newMessage, param) =>
          newMessage.replaceAll(
            new RegExp(`\\$${param}`, 'g'),
            // @ts-expect-error TS18048 we checked urlParams before
            params.urlParams[param as string],
          ),
        urlPart,
      )
  }

  return urlPart
}
