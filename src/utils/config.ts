import type { HomeAssistant } from 'custom-card-helpers'

import hassService from '@/service/hass-service'
import type { ClockWeatherCardConfig, ResolvedConfig, RowConfig } from '@/types'
import { SEGMENT_TYPES, WEATHER_ICON_TYPES } from '@/types'
import { entityNotFound, invalidConfigValue } from '@/utils/errors'
import { DEFAULT_GRADIENT } from '@/utils/gradient'
import { isValidLocale, isValidTimeZone } from '@/utils/luxon'

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

function validateConfig(config: ClockWeatherCardConfig, hass: HomeAssistant): void {
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

export function resolveConfig(config: ClockWeatherCardConfig, hass: HomeAssistant): ResolvedConfig {
  validateConfig(config, hass)
  const { header, forecast_strip: strip, forecast_list: list } = config.sections ?? {}
  const weatherIconType = config.weather_icon_type || 'line'
  return {
    entity: config.entity,
    title: config.title ?? null,
    sunEntity: config.sun_entity ?? 'sun.sun',
    weatherIconType,
    timeZone: config.time_zone || hassService.getTimeZone(hass),
    locale: config.locale || hassService.getLocale(hass),
    header: {
      hidden: header?.hide ?? false,
      rows: header?.rows ?? DEFAULT_ROWS,
      animatedIcons: header?.animated_icons ?? true,
      weatherIconType: header?.weather_icon_type ?? weatherIconType,
    },
    forecastStrip: {
      hidden: strip?.hide ?? false,
      entity: strip?.weather_entity ?? config.entity,
      count: strip?.count ?? 24,
      animatedIcons: strip?.animated_icons ?? false,
      roundTemperatures: strip?.round_temperatures ?? true,
      weatherIconType: strip?.weather_icon_type ?? weatherIconType,
    },
    forecastList: {
      hidden: list?.hide ?? false,
      entity: list?.weather_entity ?? config.entity,
      count: list?.count ?? 5,
      rowHeight: list?.row_height ?? null,
      barThickness: list?.bar_thickness ?? '60%',
      hideCurrentTempIndicator: list?.hide_current_temp_indicator ?? false,
      animatedIcons: list?.animated_icons ?? false,
      roundTemperatures: list?.round_temperatures ?? true,
      weatherIconType: list?.weather_icon_type ?? weatherIconType,
      gradient: list?.gradient ?? DEFAULT_GRADIENT,
    },
  }
}
