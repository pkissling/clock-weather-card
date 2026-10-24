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
        sun_entity: 'sun.sun',
        timeZone: 'Europe/Berlin',
        locale: 'de',
        numberFormat: 'language',
        temperatureUnit: '°C',
        temperatureSensor: null,
        header: {
          hide: false,
          animated_icons: true,
          weather_icon_type: 'line',
          weather_icon_size: null,
          round_temperatures: true,
          rows: [
            {
              segments: [
                { type: 'icon', icon: 'mdi:thermometer' },
                { type: 'weather', attribute: 'temperature' },
                { type: 'spacer' },
                { type: 'weather' },
              ],
            },
            {
              font_size: '4rem',
              alignment: 'center',
              segments: [{ type: 'time' }],
            },
            {
              alignment: 'center',
              segments: [{ type: 'icon', icon: 'mdi:calendar' }, { type: 'date' }],
            },
          ],
        },
        forecast_strip: {
          hide: false,
          weather_entity: 'weather.home',
          forecast_type: 'hourly',
          count: 24,
          animated_icons: false,
          round_temperatures: true,
          weather_icon_type: 'line',
          hide_sunrise_sunset: false,
          hide_attribute: false,
          time_pattern: 't',
          attribute: 'precipitation_probability',
          attributeRequired: false,
          attribute_icon: 'mdi:water',
          attribute_color: '#3988EF',
          attribute_unit: null,
        },
        forecast_list: {
          hide: false,
          weather_entity: 'weather.home',
          forecast_type: 'daily',
          count: 5,
          row_height: '28px',
          bar_thickness: '60%',
          hide_current_temp_indicator: false,
          animated_icons: false,
          round_temperatures: true,
          time_pattern: 't',
          weather_icon_type: 'line',
          attribute: 'temperature',
          attribute_unit: null,
          gradient: DEFAULT_GRADIENT,
        },
      })
  })

  it.each([
    ['12', 'de', 'de-u-hc-h12'],
    ['24', 'de', 'de-u-hc-h23'],
    ['language', 'de', 'de'],
    ['24', 'en-u-hc-h12', 'en-u-hc-h12'],
  ])('applies the HA time format %s to locale %s', (timeFormat, locale, expected) => {
    const resolved = resolveConfig(config({ locale }), { ...hass, locale: { time_format: timeFormat } } as unknown as HomeAssistant)

    expect(resolved.locale)
      .toBe(expected)
  })

  it('prefers configured time zone and locale over hass', () => {
    const resolved = resolveConfig(config({ time_zone: 'America/New_York', locale: 'fr' }), hass)

    expect(resolved.timeZone)
      .toBe('America/New_York')
    expect(resolved.locale)
      .toBe('fr')
  })

  it('takes the temperature unit from the hass unit system when unset', () => {
    const usHass = { ...hass, config: { ...hass.config, unit_system: { temperature: '°F' } } } as unknown as HomeAssistant

    expect(resolveConfig(config(), usHass).temperatureUnit)
      .toBe('°F')
  })

  it('prefers the configured temperature_unit over hass', () => {
    const usHass = { ...hass, config: { ...hass.config, unit_system: { temperature: '°F' } } } as unknown as HomeAssistant

    expect(resolveConfig(config({ temperature_unit: 'celsius' }), usHass).temperatureUnit)
      .toBe('°C')
    expect(resolveConfig(config({ temperature_unit: 'fahrenheit' }), hass).temperatureUnit)
      .toBe('°F')
  })

  it('lets sections inherit the card weather_icon_type', () => {
    const resolved = resolveConfig(config({ weather_icon_type: 'fill' }), hass)

    expect(resolved.header.weather_icon_type)
      .toBe('fill')
    expect(resolved.forecast_strip.weather_icon_type)
      .toBe('fill')
    expect(resolved.forecast_list.weather_icon_type)
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

    expect(resolved.header.weather_icon_type)
      .toBe('flat')
    expect(resolved.forecast_strip)
      .toMatchObject({ weather_entity: 'weather.strip', weather_icon_type: 'flat', count: 6 })
    expect(resolved.forecast_list)
      .toMatchObject({ weather_entity: 'weather.list', weather_icon_type: 'monochrome', count: 3 })
  })

  it('keeps defaults for section options set to undefined', () => {
    const resolved = resolveConfig(config({ sections: { forecast_list: { count: undefined, gradient: undefined } } }), hass)

    expect(resolved.forecast_list)
      .toMatchObject({ count: 5, gradient: DEFAULT_GRADIENT })
  })

  it('drops the default strip icon once a custom attribute is configured', () => {
    expect(resolveConfig(config({ sections: { forecast_strip: { attribute: 'wind_speed' } } }), hass).forecast_strip.attribute_icon)
      .toBeNull()
    expect(resolveConfig(config({ sections: { forecast_strip: { attribute: 'wind_speed', attribute_icon: 'mdi:weather-windy' } } }), hass).forecast_strip.attribute_icon)
      .toBe('mdi:weather-windy')
  })

  it('prefers a configured gradient over the attribute default', () => {
    const resolved = resolveConfig(config({ sections: { forecast_list: { attribute: 'humidity', gradient: { 0: '#000000' } } } }), hass)

    expect(resolved.forecast_list.gradient)
      .toEqual({ 0: '#000000' })
  })
})
