import type { WeatherForecast } from '@/types'

export function forecastAttributeValue(forecast: WeatherForecast, attribute: string): number | null {
  const value = (forecast as unknown as Record<string, unknown>)[attribute]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function formatWithUnit(value: number, unit: string | null | undefined): string {
  if (!unit) return String(value)
  return /^\p{L}/u.test(unit) ? `${value} ${unit}` : `${value}${unit}`
}
