import logger from '@/service/logger'
import type { TemperatureUnit } from '@/types'

export const isTemperatureUnit = (unit: unknown): unit is TemperatureUnit => unit === '°C' || unit === '°F'

export const toCelsius = (value: number, unit: TemperatureUnit): number => unit === '°F' ? (value - 32) * 5 / 9 : value

const fromCelsius = (value: number, unit: TemperatureUnit): number => unit === '°F' ? value * 9 / 5 + 32 : value

export function convertTemperature(value: number, from: string | null, to: TemperatureUnit): number {
  if (!isTemperatureUnit(from)) {
    logger.error(`Unsupported temperature unit "${from}", showing temperatures unconverted`)
    return value
  }
  if (from === to) return value
  const decimals = String(value)
    .split('.')[1]?.length ?? 0
  return Number(fromCelsius(toCelsius(value, from), to)
    .toFixed(decimals))
}
