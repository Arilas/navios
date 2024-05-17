import type {
  Navios,
  NaviosConfig,
  NaviosError,
  NaviosRequestConfig,
  NaviosResponse,
} from 'navios'

export type HttpModuleOptions = NaviosConfig & {
  interceptors?: {
    request?: [
      onInit: (onInit: NaviosRequestConfig<any, any>, client: Navios) => any,
      onRejected?: (config: NaviosError, client: Navios) => any,
    ][]
    response?: [
      onSuccess: (response: NaviosResponse<any>, client: Navios) => any,
      onRejected?: (error: NaviosError, client: Navios) => any,
    ][]
  }
}
