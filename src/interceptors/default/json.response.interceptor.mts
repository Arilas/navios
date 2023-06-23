import type { NaviosError, NaviosResponse } from "../../types.mjs"

export function jsonResponseInterceptor(response: NaviosResponse<any>) {
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return {
      ...response,
      data: JSON.parse(response.data),
    }
  }
  return response
}

export function jsonErrorInterceptor(err: NaviosError<any>) {
  const contentType = err?.response?.headers?.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return {
      ...err,
      response: {
        ...err.response,
        data: JSON.parse(err.response.data),
      },
    }
  }
  return err
}
