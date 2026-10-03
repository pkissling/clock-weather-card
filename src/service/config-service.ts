import type { HomeAssistant } from 'custom-card-helpers'

import hassService from '@/service/hass-service'
import type { ClockWeatherCardConfig, RowConfig, WeatherIconType } from '@/types'
import { SEGMENT_TYPES, WEATHER_ICON_TYPES } from '@/types'
import { entityNotFound, invalidConfigValue } from '@/utils/errors'
import { DEFAULT_GRADIENT } from '@/utils/gradient'
import { isValidLocale, isValidTimeZone } from '@/utils/luxon'

const DEFAULT_SUN_ENTITY = 'sun.sun'
const DEFAULT_WEATHER_ICON_TYPE: WeatherIconType = 'line'
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
      if (allowed.includes(value)) return
      const allowedList = allowed.map(a => `"${a}"`)
        .join(', ')
      throw invalidConfigValue(path, value, `one of ${allowedList}`)
    }
    const assertPositiveInteger = (path: string, value: number | undefined): void => {
      if (value === undefined) return
      if (!Number.isInteger(value) || value <= 0) throw invalidConfigValue(path, String(value), 'a positive integer')
    }
    // YAML configs can violate the declared types at runtime, so re-check with typeof.
    const assertCssLength = (path: string, value: unknown): void => {
      if (value === undefined) return
      if (typeof value !== 'string' || !/^\d+(\.\d+)?(px|rem|em|vh|vw|%)$/i.test(value.trim())) {
        throw invalidConfigValue(path, String(value), 'a CSS length in px, rem, em, vh, vw or %')
      }
    }

    assertEntityExists(config.entity)
    assertEntityExists(config.sun_entity)
    assertEntityExists(config.sections?.forecast_strip?.weather_entity)
    assertEntityExists(config.sections?.forecast_list?.weather_entity)

    assertEnumValue('weather_icon_type', config.weather_icon_type, WEATHER_ICON_TYPES)
    assertEnumValue('sections.header.weather_icon_type', config.sections?.header?.weather_icon_type, WEATHER_ICON_TYPES)
    assertEnumValue('sections.forecast_strip.weather_icon_type', config.sections?.forecast_strip?.weather_icon_type, WEATHER_ICON_TYPES)
    assertEnumValue('sections.forecast_list.weather_icon_type', config.sections?.forecast_list?.weather_icon_type, WEATHER_ICON_TYPES)
    assertEnumValue('sections.forecast_strip.forecast_type', config.sections?.forecast_strip?.forecast_type, ['hourly'])
    assertEnumValue('sections.forecast_list.forecast_type', config.sections?.forecast_list?.forecast_type, ['daily'])
    config.sections?.header?.rows?.forEach((row, i) => {
      row.segments?.forEach((segment, j) => {
        assertEnumValue(`sections.header.rows[${i}].segments[${j}].type`, segment.type, SEGMENT_TYPES)
      })
    })

    assertPositiveInteger('sections.forecast_strip.count', config.sections?.forecast_strip?.count)
    assertPositiveInteger('sections.forecast_list.count', config.sections?.forecast_list?.count)

    assertCssLength('sections.forecast_list.row_height', config.sections?.forecast_list?.row_height)
    assertCssLength('sections.forecast_list.bar_thickness', config.sections?.forecast_list?.bar_thickness)

    const gradient = config.sections?.forecast_list?.gradient
    if (gradient !== undefined) {
      if (typeof gradient !== 'object' || gradient === null || Array.isArray(gradient)) {
        throw invalidConfigValue('sections.forecast_list.gradient', String(gradient), 'a map of percentages to colors')
      }
      for (const [k, v] of Object.entries(gradient)) {
        if (!Number.isFinite(Number(k))) throw invalidConfigValue('sections.forecast_list.gradient', `key "${k}"`, 'numeric percentage keys')
        if (typeof v !== 'string' || v.trim() === '') throw invalidConfigValue('sections.forecast_list.gradient', `value at "${k}"`, 'non-empty color strings')
      }
    }

    if (config.time_zone && !isValidTimeZone(config.time_zone)) {
      throw invalidConfigValue('time_zone', config.time_zone, 'an IANA time zone such as "Europe/Berlin"')
    }

    if (config.locale && !isValidLocale(config.locale)) {
      throw invalidConfigValue('locale', config.locale, 'a BCP 47 language tag such as "en-US"')
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

  public getTimeZone(config: ClockWeatherCardConfig, hass: HomeAssistant): string {
    return config.time_zone || hassService.getTimeZone(hass)
  }

  public getLocale(config: ClockWeatherCardConfig, hass: HomeAssistant): string {
    return config.locale || hassService.getLocale(hass)
  }

  public getHeader(config: ClockWeatherCardConfig): HeaderConfig {
    const section = config.sections?.header
    return {
      isHidden: () => section?.hide ?? false,
      getRows: () => section?.rows ?? DEFAULT_ROWS,
      getAnimatedIcons: () => section?.animated_icons ?? true,
      getWeatherIconType: () => section?.weather_icon_type ?? this.getWeatherIconType(config),
    }
  }

  public getForecastStrip(config: ClockWeatherCardConfig): ForecastStripConfig {
    const section = config.sections?.forecast_strip
    return {
      isHidden: () => section?.hide ?? false,
      getEntity: () => section?.weather_entity ?? this.getEntity(config),
      getCount: () => section?.count ?? 24,
      getAnimatedIcons: () => section?.animated_icons ?? false,
      getRoundTemperatures: () => section?.round_temperatures ?? true,
      getWeatherIconType: () => section?.weather_icon_type ?? this.getWeatherIconType(config),
    }
  }

  public getForecastList(config: ClockWeatherCardConfig): ForecastListConfig {
    const section = config.sections?.forecast_list
    return {
      isHidden: () => section?.hide ?? false,
      getEntity: () => section?.weather_entity ?? this.getEntity(config),
      getRowHeight: () => section?.row_height ?? null,
      getBarThickness: () => section?.bar_thickness ?? '60%',
      getCount: () => section?.count ?? 5,
      isCurrentTempIndicatorHidden: () => section?.hide_current_temp_indicator ?? false,
      getAnimatedIcons: () => section?.animated_icons ?? false,
      getRoundTemperatures: () => section?.round_temperatures ?? true,
      getWeatherIconType: () => section?.weather_icon_type ?? this.getWeatherIconType(config),
      getGradient: () => section?.gradient ?? DEFAULT_GRADIENT,
    }
  }
}

export interface HeaderConfig {
  isHidden: () => boolean
  getRows: () => RowConfig[]
  getAnimatedIcons: () => boolean
  getWeatherIconType: () => WeatherIconType
}

export interface ForecastStripConfig {
  isHidden: () => boolean
  getEntity: () => string
  getCount: () => number
  getAnimatedIcons: () => boolean
  getRoundTemperatures: () => boolean
  getWeatherIconType: () => WeatherIconType
}

export interface ForecastListConfig {
  isHidden: () => boolean
  getEntity: () => string
  getRowHeight: () => string | null
  getBarThickness: () => string
  getCount: () => number
  isCurrentTempIndicatorHidden: () => boolean
  getAnimatedIcons: () => boolean
  getRoundTemperatures: () => boolean
  getWeatherIconType: () => WeatherIconType
  getGradient: () => Record<number | string, string>
}

export default new ConfigService()
