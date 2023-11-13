import { InjectionToken } from '@angular/core'
import { Navios } from 'navios'

export const NAVIOS_INSTANCE_TOKEN = 'NAVIOS_INSTANCE_TOKEN'

export const NaviosInjectionToken = new InjectionToken<Navios>(
  NAVIOS_INSTANCE_TOKEN,
)
