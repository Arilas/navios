import type { NaviosError } from '../../NaviosError.mjs'
import type { NaviosResponse } from '../../types.mjs'

export function jsonResponseInterceptor(response: NaviosResponse<any>) {
  const contentType = response.headers.get('content-type')
  if (
    contentType &&
    contentType.includes('application/json') &&
    typeof response.data === 'string'
  ) {
    return {
      ...response,
      data: JSON.parse(response.data),
    }
  }
  return response
}

export function jsonErrorInterceptor(err: NaviosError<any>) {
  const contentType = err?.response?.headers?.get('content-type')
  if (
    contentType &&
    contentType.includes('application/json') &&
    typeof err.response.data === 'string'
  ) {
    throw {
      ...err,
      response: {
        ...err.response,
        data: JSON.parse(err.response.data),
      },
    }
  }
  throw err
}
