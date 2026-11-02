import type { WeatherForecast } from '@/types'

export const MISSING_VALUE = '–'

export function forecastAttributeValue(forecast: WeatherForecast, attribute: string): number | null {
  const value = (forecast as unknown as Record<string, unknown>)[attribute]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

// Probabilities round to the nearest 10 and a dry 0 stays blank, so precipitation values don't clutter the forecast.
export function displayedAttributeValue(forecast: WeatherForecast, attribute: string): number | null {
  const raw = forecastAttributeValue(forecast, attribute)
  const value = raw !== null && attribute === 'precipitation_probability' ? Math.round(raw / 10) * 10 : raw
  return value === 0 && (attribute === 'precipitation' || attribute === 'precipitation_probability') ? null : value
}

export function formatWithUnit(value: string, unit: string | null | undefined): string {
  if (!unit) return value
  return /^\p{L}/u.test(unit) ? `${value} ${unit}` : `${value}${unit}`
}
