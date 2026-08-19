import type { HomeAssistant } from 'custom-card-helpers'

import hassService from '@/service/hass-service'
import type { ClockWeatherCardConfig, RowConfig, WeatherIconType } from '@/types'
import { WEATHER_ICON_TYPES } from '@/types'
import { entityNotFound, invalidConfigValue } from '@/utils/errors'
import { DEFAULT_GRADIENT } from '@/utils/gradient'
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
    // YAML configs can violate the declared types at runtime, so both helpers re-check with typeof.
    const assertCssLength = (path: string, value: unknown): void => {
      if (value === undefined) return
      if (typeof value !== 'string' || !/^\d+(\.\d+)?(px|rem|em|vh|vw|%)$/i.test(value.trim())) {
        throw invalidConfigValue(path, String(value))
      }
    }
    const assertRatio = (path: string, value: unknown): void => {
      if (value === undefined) return
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1) {
        throw invalidConfigValue(path, String(value))
      }
    }

    assertEntityExists(config.entity)
    assertEntityExists(config.sun_entity)
    assertEntityExists(config.sections?.hourly_forecast?.weather_entity)
    assertEntityExists(config.sections?.daily_forecast?.weather_entity)

    assertEnumValue('weather_icon_type', config.weather_icon_type, WEATHER_ICON_TYPES)
    assertEnumValue('sections.hourly_forecast.weather_icon_type', config.sections?.hourly_forecast?.weather_icon_type, WEATHER_ICON_TYPES)
    assertEnumValue('sections.daily_forecast.weather_icon_type', config.sections?.daily_forecast?.weather_icon_type, WEATHER_ICON_TYPES)

    assertPositiveInteger('sections.hourly_forecast.hours', config.sections?.hourly_forecast?.hours)
    assertPositiveInteger('sections.daily_forecast.rows', config.sections?.daily_forecast?.rows)

    assertCssLength('sections.daily_forecast.row_height', config.sections?.daily_forecast?.row_height)
    assertRatio('sections.daily_forecast.bar_height_ratio', config.sections?.daily_forecast?.bar_height_ratio)

    const gradient = config.sections?.daily_forecast?.gradient
    if (gradient !== undefined) {
      if (typeof gradient !== 'object' || gradient === null || Array.isArray(gradient)) {
        throw invalidConfigValue('sections.daily_forecast.gradient', String(gradient))
      }
      for (const [k, v] of Object.entries(gradient)) {
        if (!Number.isFinite(Number(k))) throw invalidConfigValue('sections.daily_forecast.gradient', `key "${k}"`)
        if (typeof v !== 'string' || v.trim() === '') throw invalidConfigValue('sections.daily_forecast.gradient', `value at "${k}"`)
      }
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

  public getHourly(config: ClockWeatherCardConfig): HourlyForecastConfig {
    const section = config.sections?.hourly_forecast
    return {
      isHidden: () => section?.hide ?? false,
      getEntity: () => section?.weather_entity ?? this.getEntity(config),
      getHours: () => section?.hours ?? 24,
      getAnimatedIcons: () => section?.animated_icons ?? false,
      getRoundTemperatures: () => section?.round_temperatures ?? true,
      getWeatherIconType: () => section?.weather_icon_type ?? this.getWeatherIconType(config),
    }
  }

  public getDaily(config: ClockWeatherCardConfig): DailyForecastConfig {
    const section = config.sections?.daily_forecast
    return {
      isHidden: () => section?.hide ?? false,
      getEntity: () => section?.weather_entity ?? this.getEntity(config),
      getRowHeight: () => section?.row_height ?? null,
      getBarHeightRatio: () => section?.bar_height_ratio ?? 0.6,
      getRows: () => section?.rows ?? 5,
      isCurrentTempIndicatorHidden: () => section?.hide_current_temp_indicator ?? false,
      getAnimatedIcons: () => section?.animated_icons ?? false,
      getRoundTemperatures: () => section?.round_temperatures ?? true,
      getWeatherIconType: () => section?.weather_icon_type ?? this.getWeatherIconType(config),
      getGradient: () => section?.gradient ?? DEFAULT_GRADIENT,
    }
  }
}

export interface HourlyForecastConfig {
  isHidden: () => boolean
  getEntity: () => string
  getHours: () => number
  getAnimatedIcons: () => boolean
  getRoundTemperatures: () => boolean
  getWeatherIconType: () => WeatherIconType
}

export interface DailyForecastConfig {
  isHidden: () => boolean
  getEntity: () => string
  getRowHeight: () => string | null
  getBarHeightRatio: () => number
  getRows: () => number
  isCurrentTempIndicatorHidden: () => boolean
  getAnimatedIcons: () => boolean
  getRoundTemperatures: () => boolean
  getWeatherIconType: () => WeatherIconType
  getGradient: () => Record<number | string, string>
}

export default new ConfigService()
