import type { HomeAssistant } from 'custom-card-helpers'

import hassService from '@/service/hass-service'
import type { ClockWeatherCardConfig, ResolvedConfig, RowConfig } from '@/types'
import { ROW_ALIGNMENTS, SECTION_FORECAST_TYPES, SEGMENT_TYPES, TEMPERATURE_UNIT_SYMBOLS, WEATHER_ICON_TYPES } from '@/types'
import { entityNotFound, invalidConfigValue, optionRequiresValue } from '@/utils/errors'
import { DEFAULT_GRADIENT, isSupportedColor } from '@/utils/gradient'
import { DEFAULT_TIME_PATTERN, isValidLocale, isValidTimeZone } from '@/utils/luxon'

export const DEFAULT_ROWS: RowConfig[] = [
  {
    segments: [
      { type: 'icon', icon: 'mdi:thermometer' },
      { type: 'weather', attribute: 'temperature' },
      { type: 'spacer' },
      { type: 'weather' }
    ]
  },
  {
    font_size: '4rem',
    alignment: 'center',
    segments: [
      { type: 'time' }
    ]
  },
  {
    alignment: 'center',
    segments: [
      { type: 'icon', icon: 'mdi:calendar' },
      { type: 'date' }
    ]
  }
]

export const DEFAULTS = {
  weather_icon_type: 'line',
  sun_entity: 'sun.sun',
  sections: {
    header: { hide: false, animated_icons: true },
    forecast_strip: { hide: false, forecast_type: 'hourly', count: 24, animated_icons: false, round_temperatures: true, hide_sunrise_sunset: false, time_pattern: DEFAULT_TIME_PATTERN, attribute: 'precipitation_probability' },
    forecast_list: { hide: false, forecast_type: 'daily', count: 5, row_height: '28px', bar_thickness: '60%', hide_current_temp_indicator: false, animated_icons: false, round_temperatures: true, time_pattern: DEFAULT_TIME_PATTERN, attribute: 'temperature' },
  },
} as const satisfies Partial<ClockWeatherCardConfig>

type StripConfig = NonNullable<ClockWeatherCardConfig['sections']>['forecast_strip']

// The default precipitation row gets its own color; custom attributes and monochrome icons use the theme colors.
export const defaultAttributeColor = (strip: StripConfig, weatherIconType: string): string | null =>
  strip?.attribute || weatherIconType === 'monochrome' ? null : '#3988EF'

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
  const assertBoolean = (path: string, value: unknown): void => {
    if (value === undefined) return
    if (typeof value !== 'boolean') throw invalidConfigValue(path, String(value), 'true or false')
  }
  const assertNonEmptyString = (path: string, value: unknown): void => {
    if (value === undefined) return
    if (typeof value !== 'string' || value.trim() === '') throw invalidConfigValue(path, String(value), 'a non-empty string')
  }
  const assertString = (path: string, value: unknown): void => {
    if (value !== undefined && typeof value !== 'string') throw invalidConfigValue(path, String(value), 'a string')
  }
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

  const { header, forecast_strip: strip, forecast_list: list } = config.sections ?? {}
  if (strip?.hide_sunrise_sunset === true && (strip.forecast_type ?? 'hourly') !== 'hourly') {
    throw optionRequiresValue('sections.forecast_strip.hide_sunrise_sunset', 'sections.forecast_strip.forecast_type', 'hourly')
  }

  assertEnumValue('weather_icon_type', config.weather_icon_type, WEATHER_ICON_TYPES)
  assertEnumValue('temperature_unit', config.temperature_unit, Object.keys(TEMPERATURE_UNIT_SYMBOLS))
  assertEnumValue('sections.header.weather_icon_type', config.sections?.header?.weather_icon_type, WEATHER_ICON_TYPES)
  assertEnumValue('sections.forecast_strip.weather_icon_type', config.sections?.forecast_strip?.weather_icon_type, WEATHER_ICON_TYPES)
  assertEnumValue('sections.forecast_list.weather_icon_type', config.sections?.forecast_list?.weather_icon_type, WEATHER_ICON_TYPES)
  assertEnumValue('sections.forecast_strip.forecast_type', config.sections?.forecast_strip?.forecast_type, SECTION_FORECAST_TYPES)
  assertEnumValue('sections.forecast_list.forecast_type', config.sections?.forecast_list?.forecast_type, SECTION_FORECAST_TYPES)
  assertNonEmptyString('sections.forecast_strip.time_pattern', strip?.time_pattern)
  assertNonEmptyString('sections.forecast_list.time_pattern', config.sections?.forecast_list?.time_pattern)
  assertNonEmptyString('sections.forecast_strip.attribute', strip?.attribute)
  assertNonEmptyString('sections.forecast_strip.attribute_icon', strip?.attribute_icon)
  assertNonEmptyString('sections.forecast_strip.attribute_color', strip?.attribute_color)
  assertNonEmptyString('sections.forecast_list.attribute', list?.attribute)
  assertString('sections.forecast_strip.attribute_unit', strip?.attribute_unit)
  assertString('sections.forecast_list.attribute_unit', list?.attribute_unit)
  config.sections?.header?.rows?.forEach((row, i) => {
    assertEnumValue(`sections.header.rows[${i}].alignment`, row.alignment, ROW_ALIGNMENTS)
    row.segments?.forEach((segment, j) => {
      assertEnumValue(`sections.header.rows[${i}].segments[${j}].type`, segment.type, SEGMENT_TYPES)
      if (segment.type === 'weather_icon') assertEntityExists(segment.entity_id)
      if (segment.type === 'entity') {
        assertEntityExists(segment.entity_id)
        if (segment.attribute !== undefined && hassService.getEntityAttribute(hass, segment.entity_id, segment.attribute) === undefined) {
          throw invalidConfigValue(`sections.header.rows[${i}].segments[${j}].attribute`, segment.attribute, `an attribute of "${segment.entity_id}"`)
        }
      }
      if (segment.type === 'text' && typeof segment.text !== 'string') throw invalidConfigValue(`sections.header.rows[${i}].segments[${j}].text`, String(segment.text), 'a string')
      if ('show_unit' in segment) assertBoolean(`sections.header.rows[${i}].segments[${j}].show_unit`, segment.show_unit)
      if (segment.type === 'weather' || segment.type === 'entity') {
        const path = `sections.header.rows[${i}].segments[${j}]`
        if ('unit' in segment) {
          if (typeof segment.unit !== 'string') throw invalidConfigValue(`${path}.unit`, String(segment.unit), 'a string')
          if (segment.show_unit === false) throw optionRequiresValue(`${path}.unit`, `${path}.show_unit`, 'true')
        }
        if ('unit_attribute' in segment) {
          if (typeof segment.unit_attribute !== 'string') throw invalidConfigValue(`${path}.unit_attribute`, String(segment.unit_attribute), 'a string')
          const entityId = segment.type === 'entity' ? segment.entity_id : config.entity
          if (hassService.getEntityAttribute(hass, entityId, segment.unit_attribute) === undefined) {
            throw invalidConfigValue(`${path}.unit_attribute`, segment.unit_attribute, `an attribute of "${entityId}"`)
          }
        }
      }
    })
  })

  assertBoolean('sections.header.hide', header?.hide)
  assertBoolean('sections.header.animated_icons', header?.animated_icons)
  assertBoolean('sections.forecast_strip.hide', strip?.hide)
  assertBoolean('sections.forecast_strip.animated_icons', strip?.animated_icons)
  assertBoolean('sections.forecast_strip.round_temperatures', strip?.round_temperatures)
  assertBoolean('sections.forecast_strip.hide_sunrise_sunset', strip?.hide_sunrise_sunset)
  assertBoolean('sections.forecast_list.hide', list?.hide)
  assertBoolean('sections.forecast_list.hide_current_temp_indicator', list?.hide_current_temp_indicator)
  assertBoolean('sections.forecast_list.animated_icons', list?.animated_icons)
  assertBoolean('sections.forecast_list.round_temperatures', list?.round_temperatures)

  assertPositiveInteger('sections.forecast_strip.count', config.sections?.forecast_strip?.count)
  assertPositiveInteger('sections.forecast_list.count', config.sections?.forecast_list?.count)

  assertCssLength('sections.header.weather_icon_size', header?.weather_icon_size)
  assertCssLength('sections.forecast_list.row_height', config.sections?.forecast_list?.row_height)
  assertCssLength('sections.forecast_list.bar_thickness', config.sections?.forecast_list?.bar_thickness)

  const gradient = config.sections?.forecast_list?.gradient
  if (gradient !== undefined) {
    if (typeof gradient !== 'object' || gradient === null || Array.isArray(gradient)) {
      throw invalidConfigValue('sections.forecast_list.gradient', String(gradient), 'a map of values to colors')
    }
    for (const [k, v] of Object.entries(gradient)) {
      if (!Number.isFinite(Number(k))) throw invalidConfigValue('sections.forecast_list.gradient', `key ${k}`, 'numeric keys')
      if (typeof v !== 'string' || !isSupportedColor(v)) throw invalidConfigValue('sections.forecast_list.gradient', `value at ${k}`, 'hex (#rgb, #rrggbb) or rgb() colors')
    }
  }

  if (config.time_zone && !isValidTimeZone(config.time_zone)) {
    throw invalidConfigValue('time_zone', config.time_zone, 'an IANA time zone such as "Europe/Berlin"')
  }

  if (config.tap_action !== undefined) {
    const action = (config.tap_action as { action?: string } | null)?.action
    if (!action) throw invalidConfigValue('tap_action', String(config.tap_action), 'an object with an "action"')
    assertEnumValue('tap_action.action', action, ['more-info', 'toggle', 'navigate', 'url', 'perform-action', 'call-service', 'assist', 'fire-dom-event', 'none'])
  }

  if (config.locale && !isValidLocale(config.locale)) {
    throw invalidConfigValue('locale', config.locale, 'a BCP 47 language tag such as "en-US"')
  }
}

export function resolveConfig(config: ClockWeatherCardConfig, hass: HomeAssistant): ResolvedConfig {
  validateConfig(config, hass)
  const { header, forecast_strip: strip, forecast_list: list } = config.sections ?? {}
  const D = DEFAULTS.sections
  const weatherIconType = config.weather_icon_type || DEFAULTS.weather_icon_type
  const listAttribute = list?.attribute ?? D.forecast_list.attribute
  return {
    entity: config.entity,
    title: config.title ?? null,
    sunEntity: config.sun_entity ?? DEFAULTS.sun_entity,
    weatherIconType,
    timeZone: config.time_zone || hassService.getTimeZone(hass),
    locale: config.locale || hassService.getLocale(hass),
    temperatureUnit: config.temperature_unit ? TEMPERATURE_UNIT_SYMBOLS[config.temperature_unit] : hassService.getTemperatureUnit(hass),
    header: {
      hidden: header?.hide ?? D.header.hide,
      rows: header?.rows ?? DEFAULT_ROWS,
      animatedIcons: header?.animated_icons ?? D.header.animated_icons,
      weatherIconType: header?.weather_icon_type ?? weatherIconType,
      weatherIconSize: header?.weather_icon_size ?? null,
    },
    forecastStrip: {
      hidden: strip?.hide ?? D.forecast_strip.hide,
      entity: strip?.weather_entity ?? config.entity,
      forecastType: strip?.forecast_type ?? D.forecast_strip.forecast_type,
      count: strip?.count ?? D.forecast_strip.count,
      animatedIcons: strip?.animated_icons ?? D.forecast_strip.animated_icons,
      roundTemperatures: strip?.round_temperatures ?? D.forecast_strip.round_temperatures,
      weatherIconType: strip?.weather_icon_type ?? weatherIconType,
      hideSunriseSunset: strip?.hide_sunrise_sunset ?? D.forecast_strip.hide_sunrise_sunset,
      timePattern: strip?.time_pattern ?? D.forecast_strip.time_pattern,
      attribute: strip?.attribute ?? D.forecast_strip.attribute,
      attributeRequired: strip?.attribute !== undefined,
      attributeIcon: strip?.attribute_icon ?? (strip?.attribute ? null : 'mdi:water'),
      attributeColor: strip?.attribute_color ?? defaultAttributeColor(strip, strip?.weather_icon_type ?? weatherIconType),
      attributeUnit: strip?.attribute_unit ?? null,
    },
    forecastList: {
      hidden: list?.hide ?? D.forecast_list.hide,
      entity: list?.weather_entity ?? config.entity,
      forecastType: list?.forecast_type ?? D.forecast_list.forecast_type,
      count: list?.count ?? D.forecast_list.count,
      rowHeight: list?.row_height ?? D.forecast_list.row_height,
      barThickness: list?.bar_thickness ?? D.forecast_list.bar_thickness,
      hideCurrentTempIndicator: list?.hide_current_temp_indicator ?? D.forecast_list.hide_current_temp_indicator,
      animatedIcons: list?.animated_icons ?? D.forecast_list.animated_icons,
      roundTemperatures: list?.round_temperatures ?? D.forecast_list.round_temperatures,
      timePattern: list?.time_pattern ?? D.forecast_list.time_pattern,
      weatherIconType: list?.weather_icon_type ?? weatherIconType,
      attribute: listAttribute,
      attributeUnit: list?.attribute_unit ?? null,
      gradient: list?.gradient ?? DEFAULT_GRADIENT,
    },
  }
}
