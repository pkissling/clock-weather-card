import type { HomeAssistant } from 'custom-card-helpers'
import { describe, expect, it } from 'vitest'

import type { ClockWeatherCardConfig } from '@/types'
import { resolveConfig } from '@/utils/config'
import { DEFAULT_GRADIENT } from '@/utils/gradient'

const hass = {
  language: 'de',
  config: { time_zone: 'Europe/Berlin' },
  states: Object.fromEntries(['weather.home', 'weather.strip', 'weather.list', 'sun.sun'].map(id => [id, { state: 'ok' }])),
} as unknown as HomeAssistant

const config = (overrides: Partial<ClockWeatherCardConfig> = {}): ClockWeatherCardConfig => ({
  type: 'custom:clock-weather-card',
  entity: 'weather.home',
  ...overrides,
})

describe('resolveConfig', () => {
  it('applies defaults for a minimal config', () => {
    const resolved = resolveConfig(config(), hass)

    expect(resolved)
      .toEqual({
        entity: 'weather.home',
        title: null,
        sunEntity: 'sun.sun',
        weatherIconType: 'line',
        timeZone: 'Europe/Berlin',
        locale: 'de',
        header: {
          hidden: false,
          animatedIcons: true,
          weatherIconType: 'line',
          rows: [
            {
              segments: [
                { type: 'icon', icon: 'mdi:thermometer' },
                { type: 'weather', attribute: 'temperature' },
                { type: 'spacer' },
                { type: 'weather' },
                { type: 'icon', icon: 'mdi:weather-partly-cloudy' },
              ],
            },
            {
              font_size: '4rem',
              segments: [{ type: 'spacer' }, { type: 'time' }, { type: 'spacer' }],
            },
            {
              segments: [{ type: 'spacer' }, { type: 'icon', icon: 'mdi:calendar' }, { type: 'date' }, { type: 'spacer' }],
            },
          ],
        },
        forecastStrip: {
          hidden: false,
          entity: 'weather.home',
          count: 24,
          animatedIcons: false,
          roundTemperatures: true,
          weatherIconType: 'line',
          hideSunriseSunset: false,
        },
        forecastList: {
          hidden: false,
          entity: 'weather.home',
          count: 5,
          rowHeight: null,
          barThickness: '60%',
          hideCurrentTempIndicator: false,
          animatedIcons: false,
          roundTemperatures: true,
          weatherIconType: 'line',
          gradient: DEFAULT_GRADIENT,
        },
      })
  })

  it('prefers configured time zone and locale over hass', () => {
    const resolved = resolveConfig(config({ time_zone: 'America/New_York', locale: 'fr' }), hass)

    expect(resolved.timeZone)
      .toBe('America/New_York')
    expect(resolved.locale)
      .toBe('fr')
  })

  it('lets sections inherit the card weather_icon_type', () => {
    const resolved = resolveConfig(config({ weather_icon_type: 'fill' }), hass)

    expect(resolved.header.weatherIconType)
      .toBe('fill')
    expect(resolved.forecastStrip.weatherIconType)
      .toBe('fill')
    expect(resolved.forecastList.weatherIconType)
      .toBe('fill')
  })

  it('uses section overrides over card-level values', () => {
    const resolved = resolveConfig(config({
      weather_icon_type: 'fill',
      sections: {
        header: { weather_icon_type: 'flat' },
        forecast_strip: { weather_entity: 'weather.strip', weather_icon_type: 'flat', count: 6 },
        forecast_list: { weather_entity: 'weather.list', weather_icon_type: 'monochrome', count: 3 },
      },
    }), hass)

    expect(resolved.header.weatherIconType)
      .toBe('flat')
    expect(resolved.forecastStrip)
      .toMatchObject({ entity: 'weather.strip', weatherIconType: 'flat', count: 6 })
    expect(resolved.forecastList)
      .toMatchObject({ entity: 'weather.list', weatherIconType: 'monochrome', count: 3 })
  })

})
