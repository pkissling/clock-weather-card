import { describe, expect, it } from 'vitest'

import type { WeatherForecast } from '@/types'
import { forecastAttributeValue, formatWithUnit } from '@/utils/forecast-attributes'

const forecast = (values: Record<string, unknown>): WeatherForecast => ({
  datetime: '2025-09-14T18:00:00+00:00',
  condition: 'sunny',
  temperature: 20,
  ...values,
})

describe('forecastAttributeValue', () => {
  it.each([
    [{}, null],
    [{ wind_speed: null }, null],
    [{ wind_speed: Number.NaN }, null],
    [{ wind_speed: 'NW' }, null],
    [{ wind_speed: 12.6 }, 12.6],
  ])('reads %o as %o', (values, expected) => {
    expect(forecastAttributeValue(forecast(values), 'wind_speed'))
      .toBe(expected)
  })
})

describe('formatWithUnit', () => {
  it.each([
    [12, null, '12'],
    [12, '', '12'],
    [40, '%', '40%'],
    [21, '°C', '21°C'],
    [12, 'km/h', '12 km/h'],
  ])('formats %s with unit %o as %s', (value, unit, expected) => {
    expect(formatWithUnit(value, unit))
      .toBe(expected)
  })
})
