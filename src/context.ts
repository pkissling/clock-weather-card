import { createContext } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'

import type { ResolvedConfig } from '@/types'

export const configContext = createContext<ResolvedConfig>(Symbol('clock-weather-card-config'))
export const hassContext = createContext<HomeAssistant>(Symbol('clock-weather-card-hass'))
