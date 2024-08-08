import type { HttpMethod } from 'navios'

import type {
  EndpointConfig,
  EndpointWithDataConfig,
  NaviosZodRequest,
} from '../types.mjs'


export function makeRequestConfig<
  Config extends EndpointConfig | EndpointWithDataConfig,
>(
  request: NaviosZodRequest<Config>,
  options: Config,
  method: HttpMethod,
  finalUrlPart: string,
) {
  return {
    ...request,
    params: options.querySchema
      ? // @ts-expect-error TS2339 We know that sometimes querySchema can generate a default value
      options.querySchema.parse(request.params)
      : {},
    method,
    url: finalUrlPart,
    data:
      'requestSchema' in options
        ? // @ts-expect-error TS2339 We know that sometimes querySchema can generate a default value
        options.requestSchema.parse(request.data)
        : undefined,
  }
}
