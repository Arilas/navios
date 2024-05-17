import type { NaviosRequestConfig, NaviosResponse } from './types.mjs'

export class NaviosError<T> extends Error {
  response: NaviosResponse<T> | null
  config: NaviosRequestConfig<any, any>

  constructor(
    message: string,
    response: NaviosResponse<T> | null,
    config: NaviosRequestConfig<any, any>,
  ) {
    super(message)
    this.response = response
    this.config = config
  }
}
