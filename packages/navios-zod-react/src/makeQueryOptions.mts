import type {
  EndpointConfig,
  RequiredRequestEndpoint,
  UrlParams,
} from '@navios/navios-zod'
import type { UseQueryOptions } from '@tanstack/react-query'
import type { z } from 'zod'

import { queryOptions } from '@tanstack/react-query'

import type { BaseQueryArgs, BaseQueryParams } from './types.mjs'

export function makeQueryOptions<
  Config extends EndpointConfig,
  Options extends BaseQueryParams<Config>,
  BaseQuery extends Omit<
    UseQueryOptions<ReturnType<Options['processResponse']>, Error, any>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >,
>(
  endpoint: RequiredRequestEndpoint<Config> & { config: Config },
  options: Options,
  baseQuery: BaseQuery = {} as BaseQuery,
) {
  const config = endpoint.config
  const urlParts = config.url.split('/')
  const processResponse = options.processResponse
  return (
    params: BaseQueryArgs<Config>,
  ): Options['processResponse'] extends (...args: any[]) => infer Result
    ? UseQueryOptions<
        Result,
        Error,
        BaseQuery['select'] extends (...args: any[]) => infer T ? T : Result
      >
    : never =>
    // @ts-expect-error TS2322 We know that the processResponse is defined
    queryOptions({
      queryKey: [
        ...(options.keyPrefix ?? []),
        ...urlParts.map((part) =>
          part.startsWith('$')
            ? // @ts-expect-error TS2339 We know that the urlParams are defined only if the url has params
              params.urlParams[part.slice(1)].toString()
            : part,
        ),
        ...(options.keySuffix ?? []),
      ],
      queryFn: async ({ signal }) => {
        let result
        try {
          // @ts-expect-error TS2345 The type of request is correct
          result = await endpoint({
            signal,
            // @ts-expect-error TS2345 We bind the url params only if the url has params
            urlParams: params.urlParams as z.infer<UrlParams<Config['url']>>,
          })
        } catch (err) {
          if (options.onFail) {
            options.onFail(err)
          }
          throw err
        }

        return processResponse(result)
      },
      ...baseQuery,
    })
}
