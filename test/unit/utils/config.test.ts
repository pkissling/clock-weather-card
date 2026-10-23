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
        numberFormat: 'language',
        temperatureUnit: '°C',
        temperatureSensor: null,
        header: {
          hidden: false,
          animatedIcons: true,
          weatherIconType: 'line',
          weatherIconSize: null,
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
        forecastStrip: {
          hidden: false,
          entity: 'weather.home',
          forecastType: 'hourly',
          count: 24,
          animatedIcons: false,
          roundTemperatures: true,
          weatherIconType: 'line',
          hideSunriseSunset: false,
          timePattern: 't',
          attributes: [{ attribute: 'precipitation_probability', icon: 'mdi:water', unit: null, color: '#3988EF' }],
          attributesRequired: false,
        },
        forecastList: {
          hidden: false,
          entity: 'weather.home',
          forecastType: 'daily',
          count: 5,
          rowHeight: '28px',
          barThickness: '60%',
          hideCurrentTempIndicator: false,
          animatedIcons: false,
          roundTemperatures: true,
          timePattern: 't',
          weatherIconType: 'line',
          attribute: 'temperature',
          attributeUnit: null,
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

  it('gives only precipitation probability a default strip icon and color', () => {
    const attributes = [{ attribute: 'wind_speed' }, { attribute: 'wind_speed', icon: 'mdi:weather-windy', color: '#ff0000' }, { attribute: 'precipitation_probability' }]

    expect(resolveConfig(config({ sections: { forecast_strip: { attributes } } }), hass).forecastStrip.attributes)
      .toEqual([
        { attribute: 'wind_speed', icon: null, unit: null, color: null },
        { attribute: 'wind_speed', icon: 'mdi:weather-windy', unit: null, color: '#ff0000' },
        { attribute: 'precipitation_probability', icon: 'mdi:water', unit: null, color: '#3988EF' },
      ])
    expect(resolveConfig(config({ sections: { forecast_strip: { weather_icon_type: 'monochrome' } } }), hass).forecastStrip.attributes[0].color)
      .toBeNull()
  })

  it('prefers a configured gradient over the attribute default', () => {
    const resolved = resolveConfig(config({ sections: { forecast_list: { attribute: 'humidity', gradient: { 0: '#000000' } } } }), hass)

    expect(resolved.forecastList.gradient)
      .toEqual({ 0: '#000000' })
  })
})
