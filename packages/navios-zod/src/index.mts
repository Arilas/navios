import {
  NaviosError,
  create,
  type HttpMethod,
  type NaviosConfig,
  type NaviosRequestConfig,
} from 'navios'
import type { AnyZodObject, ZodDiscriminatedUnion, z } from 'zod'

export interface APIConfig {
  baseURL: string
  adapter?: NaviosConfig['adapter']
  useDiscriminatorResponse?: boolean
  useWholeResponse?: boolean
}

export function createAPI(config: APIConfig) {
  const client = create({
    headers: {
      'Content-Type': 'application/json',
    },
    responseType: 'json',
    ...config,
  })

  function declareEndpoint<
    ResponseSchema extends
      | AnyZodObject
      | ZodDiscriminatedUnion<any, any> = AnyZodObject,
    RequestSchema extends AnyZodObject | undefined = undefined,
  >(
    method: HttpMethod,
    urlPart: string,
    responseSchema: ResponseSchema,
    requestSchema?: RequestSchema,
  ) {
    return async (
      params: Omit<NaviosRequestConfig<any, {}>, 'method' | 'url' | 'data'> & {
        urlParams?: Record<string, string>
      } & (RequestSchema extends AnyZodObject
          ? { data: z.input<RequestSchema> }
          : {}),
    ): Promise<z.infer<ResponseSchema>> => {
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
      try {
        const result = await client.request({
          ...params,
          method,
          url: urlPart,
          data:
            'data' in params && requestSchema
              ? requestSchema.parse(params.data)
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
        if (error instanceof NaviosError) {
          if (config.useWholeResponse) {
            return responseSchema.parse(error.response)
          }
          return responseSchema.parse(error.response.data)
        }
        throw error
      }
    }
  }
  function makeMethodCreator(method: HttpMethod) {
    return <
      ResponseSchema extends AnyZodObject = AnyZodObject,
      RequestSchema extends AnyZodObject | undefined = undefined,
    >(
      url: string,
      response: ResponseSchema,
      request?: RequestSchema,
    ) => {
      return declareEndpoint<ResponseSchema, RequestSchema>(
        method,
        url,
        response,
        request,
      )
    }
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
  }
}
