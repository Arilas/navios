import type { NaviosRequestConfig } from '../types.mjs'

export function processResponseBody(
  response: Response,
  finalConfig: NaviosRequestConfig<any, any>,
) {
  switch (finalConfig.responseType) {
    case 'blob':
      return response.blob()
    case 'arrayBuffer':
      return response.arrayBuffer()
    case 'formData':
      return response.formData()
    case 'stream':
      return response.body
    case 'json':
      return response.json()
    case 'text':
    default:
      return response.text()
  }
}
