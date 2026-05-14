import type { HomeAssistant } from 'custom-card-helpers'

import hassService from '@/service/hass-service'
import type { ClockWeatherCardConfig, RowConfig, WeatherIconType } from '@/types'
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
    const entity = this.getEntity(config)
    if (!hassService.getEntityState(hass, entity)) {
      throw entityNotFound(entity)
    }

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
}

export default new ConfigService()
