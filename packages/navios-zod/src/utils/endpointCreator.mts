import type { HttpMethod, Navios } from 'navios'

import type {
  DeclareAPIConfig,
  Endpoint,
  EndpointConfig,
  EndpointWithDataConfig,
  NaviosZodRequest,
  Util_FlatType,
} from '../types.mjs'

import { bindUrlParams } from './bindUrlParams.mjs'
import { handleException } from './handleException.mjs'
import { makeRequestConfig } from './makeRequestConfig.mjs'

export function endpointCreator<
  Config extends EndpointConfig | EndpointWithDataConfig,
>(
  options: Config,
  { getClient, config }: { getClient(): Navios; config: DeclareAPIConfig },
): Util_FlatType<Endpoint<Config>> & {
  config: Config
} {
  const { method, url, responseSchema } = options
  const handler = async (
    request: NaviosZodRequest<Config> = {} as NaviosZodRequest<Config>,
  ) => {
    const client = getClient()

    const finalUrlPart = bindUrlParams<Config['url']>(url, request)
    try {
      const result = await client.request(
        makeRequestConfig(request, options, method, finalUrlPart),
      )
      if (config.useWholeResponse) {
        return responseSchema.parse(result)
      }
      return responseSchema.parse(result.data)
    } catch (error) {
      return handleException(config, error, responseSchema)
    }
  }
  handler.config = options

  return handler as unknown as Util_FlatType<Endpoint<Config>> & {
    config: Config
  }
}
