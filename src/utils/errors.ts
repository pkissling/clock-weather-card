import type { ClockWeatherCardConfig, ForecastType } from '@/types'

type ConfigAttribute = keyof {
  [K in keyof ClockWeatherCardConfig as string extends K ? never : K]: unknown
}

export const requiredConfigMissing = (attribute: ConfigAttribute): Error =>
  new Error(`Config option "${attribute}" is required`)

export const entityNotFound = (entityId: string): Error =>
  new Error(`Referenced entity "${entityId}" does not exist`)

export const invalidConfigValue = (attribute: ConfigAttribute | string, value: string, expected: string): Error =>
  new Error(`Config option "${attribute}" has invalid value "${value}", expected ${expected}`)

export const optionRequiresValue = (attribute: string, otherAttribute: string, otherValue: string): Error =>
  new Error(`Config option "${attribute}" requires "${otherAttribute}" to be "${otherValue}"`)

export const forecastNotSupported = (entityId: string, kind: ForecastType): Error =>
  new Error(`Entity "${entityId}" does not support ${kind} forecasts`)
