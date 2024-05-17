import { type HttpMethod, type NaviosConfig } from 'navios'
import type { Z } from 'vitest/dist/reporters-yx5ZTtEV.js'
import type { AnyZodObject, ZodDiscriminatedUnion, z } from 'zod'

export interface DeclareAPIConfig {
  /**
   * If your schema uses discriminatedUnion which works for both success
   * and error responses, you can set this to true to use the discriminator
   * to parse error response using the same schema as success response.
   */
  useDiscriminatorResponse?: boolean
  /**
   * If you want to use the whole response object instead of just the data
   * for the response schema, you can set this to true.
   */
  useWholeResponse?: boolean
}

export interface NaviosZodRequestBase extends RequestInit {
  headers?: Record<string, string>
  baseURL?: string
  validateStatus?: (status: number) => boolean
  urlParams?: Record<string, string>
}

export type NaviosZodRequest<
  Config extends EndpointConfig | EndpointWithDataConfig,
> = NaviosZodRequestBase &
  (Config extends EndpointWithDataConfig
    ? { data: z.input<EndpointRequestSchema<Config>> }
    : {}) &
  (Config['querySchema'] extends AnyZodObject
    ? { params: z.input<Config['querySchema']> }
    : {})

export interface APIConfig extends DeclareAPIConfig {
  baseURL: string
  adapter?: NaviosConfig['adapter']
  headers?: Record<string, string>
}

export interface EndpointConfig {
  method: HttpMethod
  url: string
  responseSchema: AnyZodObject | ZodDiscriminatedUnion<any, any>
  querySchema?: AnyZodObject
}

export interface EndpointWithDataConfig extends EndpointConfig {
  method: 'POST' | 'PUT' | 'PATCH'
  requestSchema: AnyZodObject
}

export type EndpointMethod<Config extends EndpointConfig> = Config['method']
export type EndpointURL<Config extends EndpointConfig> = Config['url']
export type EndpointResponseSchema<Config extends EndpointConfig> =
  Config['responseSchema']
export type EndpointQuerySchema<Config extends EndpointConfig> =
  Config['querySchema']
export type EndpointRequestSchema<Config extends EndpointWithDataConfig> =
  Config['requestSchema']
export type IsEndpointWithData<Config extends EndpointConfig> =
  Config extends EndpointWithDataConfig ? true : false
