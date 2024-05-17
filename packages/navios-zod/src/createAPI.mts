import { create } from 'navios'
import type { APIConfig } from './types.mjs'
import { declareAPI } from './declareAPI.mjs'

export function createAPI(config: APIConfig) {
  const client = create({
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    responseType: 'json',
    ...config,
  })

  const api = declareAPI(config)
  api.provideClient(client)
  return api
}
