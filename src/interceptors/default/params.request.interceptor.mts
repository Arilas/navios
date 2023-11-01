import type { NaviosRequestConfig } from '../../types.mjs'

export function paramsRequestInterceptor(
  config: NaviosRequestConfig<any, any>,
) {
  if (config.params && config.url && !config.url.includes('?')) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(config.params)) {
      if (value == null) continue
      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, item)
        }
        continue
      }
      if (typeof value === 'object') {
        params.append(key, JSON.stringify(value))
        continue
      }
      // @ts-ignore
      params.append(key, value)
    }
    const search = params.toString()
    if (search.length > 0) {
      config.url = `${config.url}?${search}`
    }
  }
  return config
}
