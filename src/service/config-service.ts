import type { HomeAssistant } from 'custom-card-helpers'

import hassService from '@/service/hass-service'
import type { ClockWeatherCardConfig, RowConfig, WeatherIconType } from '@/types'
import { WEATHER_ICON_TYPES } from '@/types'
import { entityNotFound, invalidConfigValue } from '@/utils/errors'
import { isValidLocale, isValidTimeZone } from '@/utils/luxon'

const DEFAULT_SUN_ENTITY = 'sun.sun'
const DEFAULT_WEATHER_ICON_TYPE: WeatherIconType = 'line'
const DEFAULT_ANIMATED_ICON = true
const DEFAULT_ROWS: RowConfig[] = [
  {
    segments: [
      { type: 'icon', icon: 'mdi:thermometer' },
      { type: 'weather', attribute: 'temperature' },
      { type: 'spacer' },
      { type: 'weather' },
      { type: 'icon', icon: 'mdi:weather-partly-cloudy' }
    ]
  },
  {
    font_size: '4rem',
    segments: [
      { type: 'spacer' },
      { type: 'time' },
      { type: 'spacer' }
    ]
  },
  {
    segments: [
      { type: 'spacer' },
      { type: 'icon', icon: 'mdi:calendar' },
      { type: 'date' },
      { type: 'spacer' }
    ]
  }
]

class ConfigService {

  public getEntity(config: ClockWeatherCardConfig): string {
    return config.entity
  }

  public validateConfig(config: ClockWeatherCardConfig, hass: HomeAssistant): void {
    const assertEntityExists = (id: string | undefined): void => {
      if (id && !hassService.getEntityState(hass, id)) throw entityNotFound(id)
    }
    const assertEnumValue = (path: string, value: string | undefined, allowed: readonly string[]): void => {
      if (!value) return
      if (!allowed.includes(value)) throw invalidConfigValue(path, value)
    }
    const assertPositiveInteger = (path: string, value: number | undefined): void => {
      if (value === undefined) return
      if (!Number.isInteger(value) || value <= 0) throw invalidConfigValue(path, String(value))
    }

    assertEntityExists(config.entity)
    assertEntityExists(config.sun_entity)
    assertEntityExists(config.sections?.hourly_forecast?.weather_entity)

    assertEnumValue('weather_icon_type', config.weather_icon_type, WEATHER_ICON_TYPES)
    assertEnumValue('sections.hourly_forecast.weather_icon_type', config.sections?.hourly_forecast?.weather_icon_type, WEATHER_ICON_TYPES)

    assertPositiveInteger('sections.hourly_forecast.hours', config.sections?.hourly_forecast?.hours)

    if (config.time_zone && !isValidTimeZone(config.time_zone)) {
      throw invalidConfigValue('time_zone', config.time_zone)
    }

    if (config.locale && !isValidLocale(config.locale)) {
      throw invalidConfigValue('locale', config.locale)
    }
  }

  public isValidConfig(config: ClockWeatherCardConfig, hass: HomeAssistant): boolean {
    try {
      this.validateConfig(config, hass)
      return true
    } catch {
      return false
    }
  }

  public getTitle(config: ClockWeatherCardConfig): string | null {
    return config.title ?? null
  }

  public getSunEntity(config: ClockWeatherCardConfig): string {
    return config.sun_entity ?? DEFAULT_SUN_ENTITY
  }

  public getWeatherIconType(config: ClockWeatherCardConfig): WeatherIconType {
    return config.weather_icon_type || DEFAULT_WEATHER_ICON_TYPE
  }

  public getAnimatedIcon(config: ClockWeatherCardConfig): boolean {
    return config.animated_icon ?? DEFAULT_ANIMATED_ICON
  }

  public getTimeZone(config: ClockWeatherCardConfig, hass: HomeAssistant): string {
    return config.time_zone || hassService.getTimeZone(hass)
  }

  public getLocale(config: ClockWeatherCardConfig, hass: HomeAssistant): string {
    return config.locale || hassService.getLocale(hass)
  }

  public getRows(config: ClockWeatherCardConfig): RowConfig[] {
    return config.rows ?? DEFAULT_ROWS
  }

  public isHourlyForecastHidden(config: ClockWeatherCardConfig): boolean {
    return config.sections?.hourly_forecast?.hide ?? false
  }

  public getHourlyForecastEntity(config: ClockWeatherCardConfig): string {
    return config.sections?.hourly_forecast?.weather_entity ?? this.getEntity(config)
  }

  public getHourlyForecastHours(config: ClockWeatherCardConfig): number {
    return config.sections?.hourly_forecast?.hours ?? 24
  }

  public getHourlyForecastAnimatedIcons(config: ClockWeatherCardConfig): boolean {
    return config.sections?.hourly_forecast?.animated_icons ?? false
  }

  public getHourlyForecastRoundTemperatures(config: ClockWeatherCardConfig): boolean {
    return config.sections?.hourly_forecast?.round_temperatures ?? true
  }

  public getHourlyForecastWeatherIconType(config: ClockWeatherCardConfig): WeatherIconType {
    return config.sections?.hourly_forecast?.weather_icon_type ?? this.getWeatherIconType(config)
  }
}

export default new ConfigService()
