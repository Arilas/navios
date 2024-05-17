import type { Navios } from 'navios'

import { InjectionToken } from '@angular/core'

export const NAVIOS_INSTANCE_TOKEN = 'NAVIOS_INSTANCE_TOKEN'

export const NaviosInjectionToken = new InjectionToken<Navios>(
  NAVIOS_INSTANCE_TOKEN,
)
