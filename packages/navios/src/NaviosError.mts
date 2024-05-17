import type { NaviosResponse, NaviosRequestConfig } from './types.mjs'

export class NaviosError<T> extends Error {
  response: NaviosResponse<T>
  config: NaviosRequestConfig<any, any>

  constructor(
    message: string,
    response: NaviosResponse<T>,
    config: NaviosRequestConfig<any, any>,
  ) {
    super(message)
    this.response = response
    this.config = config
  }
}
