import { describe, expect, it } from 'vitest'

import { convertTemperature, isTemperatureUnit, toCelsius } from '@/utils/temperature'

describe('convertTemperature', () => {
  it('returns the value unchanged when the units match', () => {
    expect(convertTemperature(21.37, '°C', '°C'))
      .toBe(21.37)
  })

  it('returns the value unchanged for an unknown source unit', () => {
    expect(convertTemperature(21, null, '°F'))
      .toBe(21)
    expect(convertTemperature(21, 'K', '°F'))
      .toBe(21)
  })

  it('converts celsius to fahrenheit keeping the source precision', () => {
    expect(convertTemperature(21, '°C', '°F'))
      .toBe(70)
    expect(convertTemperature(5.4, '°C', '°F'))
      .toBe(41.7)
    expect(convertTemperature(-40, '°C', '°F'))
      .toBe(-40)
  })

  it('converts fahrenheit to celsius keeping the source precision', () => {
    expect(convertTemperature(50, '°F', '°C'))
      .toBe(10)
    expect(convertTemperature(70.25, '°F', '°C'))
      .toBe(21.25)
  })
})

describe('toCelsius', () => {
  it('passes Celsius values through unchanged', () => {
    expect(toCelsius(10, '°C'))
      .toBe(10)
  })

  it('converts Fahrenheit to Celsius without rounding', () => {
    expect(toCelsius(32, '°F'))
      .toBe(0)
    expect(toCelsius(70, '°F'))
      .toBeCloseTo(21.1111, 4)
  })
})

describe('isTemperatureUnit', () => {
  it('accepts only °C and °F', () => {
    expect(isTemperatureUnit('°C'))
      .toBe(true)
    expect(isTemperatureUnit('°F'))
      .toBe(true)
    expect(isTemperatureUnit('%'))
      .toBe(false)
    expect(isTemperatureUnit(null))
      .toBe(false)
  })
})
