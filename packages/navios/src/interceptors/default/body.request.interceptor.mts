import type { PreparedRequestConfig } from '../../types.mjs'

import { RequestsWithoutBody } from '../../constants/index.mjs'

export function bodyRequestInterceptor(
  config: PreparedRequestConfig<any, any>,
) {
  // @ts-expect-error TS2345. We check for a certain methods
  if (config.body || RequestsWithoutBody.includes(config.method)) {
    return config
  }
  const { data } = config
  if (!data) {
    return config
  }
  if (data instanceof config.FormData || data instanceof FormData) {
    return {
      ...config,
      body: data,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    }
  }
  if (typeof data === 'object') {
    return {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  }
  // Leave as is
  return config
}
