import type { ClockWeatherCardConfig } from '@/types'

type ConfigAttribute = keyof {
  [K in keyof ClockWeatherCardConfig as string extends K ? never : K]: unknown
}

export const requiredConfigMissing = (attribute: ConfigAttribute): Error =>
  new Error(`Config option "${attribute}" is required`)

export const entityNotFound = (entityId: string): Error =>
  new Error(`Referenced entity ${entityId} does not exist`)

export const invalidConfigValue = (attribute: ConfigAttribute, value: string): Error =>
  new Error(`Config option "${attribute}" has invalid value "${value}"`)
