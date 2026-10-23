import { type ActionConfig, type HomeAssistant, type LovelaceCardConfig } from 'custom-card-helpers'
import { type HassEntity } from 'home-assistant-js-websocket/dist/types.js'

declare global {

  interface Window {
    customCards: CustomCard[]
  }

  interface CustomCard {
    type: string
    name: string
    description: string
    preview?: boolean
    documentationURL?: string
    getEntitySuggestion?: (hass: HomeAssistant, entityId: string) => { config: LovelaceCardConfig } | null
  }
}

// Segment configs
export interface TimeSegmentConfig {
  type: 'time'
  time_pattern?: string
}

export interface DateSegmentConfig {
  type: 'date'
  date_pattern?: string
}

export interface WeatherSegmentConfig {
  type: 'weather'
  attribute?: string
  show_unit?: boolean
  unit?: string
  unit_attribute?: string
}

export interface EntitySegmentConfig {
  type: 'entity'
  entity_id: string
  attribute?: string
  show_unit?: boolean
  unit?: string
  unit_attribute?: string
}

export interface IconSegmentConfig {
  type: 'icon'
  icon: string
}

export interface WeatherIconSegmentConfig {
  type: 'weather_icon'
  entity_id?: string
}

export interface TextSegmentConfig {
  type: 'text'
  text: string
}

export interface SpacerSegmentConfig {
  type: 'spacer'
}

export type SegmentConfig =
  | TimeSegmentConfig
  | DateSegmentConfig
  | WeatherSegmentConfig
  | EntitySegmentConfig
  | IconSegmentConfig
  | WeatherIconSegmentConfig
  | TextSegmentConfig
  | SpacerSegmentConfig

export const SEGMENT_TYPES = ['time', 'date', 'weather', 'entity', 'icon', 'weather_icon', 'text', 'spacer'] as const satisfies readonly SegmentConfig['type'][]

export interface ForecastStripAttributeConfig {
  attribute: string
  icon?: string
  unit?: string
  color?: string
}

export const ROW_ALIGNMENTS = ['left', 'center', 'right'] as const

export interface RowConfig {
  segments: SegmentConfig[]
  font_size?: string
  alignment?: typeof ROW_ALIGNMENTS[number]
}

// Card configs
export interface ClockWeatherCardConfig extends LovelaceCardConfig {
  entity: string
  title?: string
  sun_entity?: string
  weather_icon_type?: WeatherIconType
  time_zone?: string
  locale?: string
  temperature_unit?: TemperatureUnitOption
  temperature_sensor?: string
  tap_action?: ActionConfig
  sections?: {
    header?: {
      hide?: boolean
      animated_icons?: boolean
      weather_icon_type?: WeatherIconType
      weather_icon_size?: string
      rows?: RowConfig[]
    }
    forecast_strip?: {
      hide?: boolean
      weather_entity?: string
      forecast_type?: SectionForecastType
      count?: number
      animated_icons?: boolean
      round_temperatures?: boolean
      weather_icon_type?: WeatherIconType
      hide_sunrise_sunset?: boolean
      time_pattern?: string
      attributes?: ForecastStripAttributeConfig[]
    }
    forecast_list?: {
      hide?: boolean
      weather_entity?: string
      forecast_type?: SectionForecastType
      count?: number
      row_height?: string
      bar_thickness?: string
      hide_current_temp_indicator?: boolean
      animated_icons?: boolean
      round_temperatures?: boolean
      time_pattern?: string
      weather_icon_type?: WeatherIconType
      attribute?: string
      attribute_unit?: string
      gradient?: Record<number, string>
    }
  }
}

export interface ResolvedConfig {
  entity: string
  title: string | null
  sunEntity: string
  weatherIconType: WeatherIconType
  timeZone: string
  locale: string
  numberFormat: string
  temperatureUnit: TemperatureUnit
  temperatureSensor: string | null
  header: ResolvedHeaderConfig
  forecastStrip: ResolvedForecastStripConfig
  forecastList: ResolvedForecastListConfig
}

export interface ResolvedHeaderConfig {
  hidden: boolean
  rows: RowConfig[]
  animatedIcons: boolean
  weatherIconType: WeatherIconType
  weatherIconSize: string | null
}

export interface ResolvedForecastStripConfig {
  hidden: boolean
  entity: string
  forecastType: SectionForecastType
  count: number
  animatedIcons: boolean
  roundTemperatures: boolean
  weatherIconType: WeatherIconType
  hideSunriseSunset: boolean
  timePattern: string
  attributes: ResolvedForecastStripAttribute[]
  attributesRequired: boolean
}

export interface ResolvedForecastStripAttribute {
  attribute: string
  icon: string | null
  unit: string | null
  color: string | null
}

export interface ResolvedForecastListConfig {
  hidden: boolean
  entity: string
  forecastType: SectionForecastType
  count: number
  animatedIcons: boolean
  roundTemperatures: boolean
  timePattern: string
  weatherIconType: WeatherIconType
  rowHeight: string
  barThickness: string
  hideCurrentTempIndicator: boolean
  attribute: string
  attributeUnit: string | null
  gradient: Record<number | string, string>
}

export const enum WeatherEntityFeature {
  FORECAST_DAILY = 1,
  FORECAST_HOURLY = 2,
  FORECAST_TWICE_DAILY = 4,
}

export type TemperatureUnit = '°C' | '°F'

export const TEMPERATURE_UNIT_SYMBOLS = { celsius: '°C', fahrenheit: '°F' } as const satisfies Record<string, TemperatureUnit>
export type TemperatureUnitOption = keyof typeof TEMPERATURE_UNIT_SYMBOLS

export interface WeatherForecast {
  datetime: string
  temperature: number
  condition: string
  templow?: number
  precipitation_probability?: number | null
}

export interface DailyWeatherForecast extends WeatherForecast {
  templow: number
}

export type ForecastStripItem = {
  label: string
  condition: string
  isNight: boolean
  animatedIcon: boolean
  weatherIconType: WeatherIconType
  attributes: { icon: string | null, color: string | null, value: string | null }[]
} & (
  | { temperature: string, temperatureLow: string | null, temperatureUnit: TemperatureUnit, sunEvent?: never }
  | { sunEvent: { kind: 'sunrise' | 'sunset', label: string }, temperature?: never, temperatureLow?: never, temperatureUnit?: never }
)

export interface GradientStop {
  percent: number
  color: string
}

export interface ForecastListItem {
  label: string
  condition: string
  isNight: boolean
  animatedIcon: boolean
  weatherIconType: WeatherIconType
  lowLabel: string | null
  highLabel: string | null
  barLowPercent: number
  barHighPercent: number
  gradientStops: GradientStop[]
  showCurrentIndicator: boolean
  currentTempPercent: number
}

export type ForecastType = 'hourly' | 'daily' | 'twice_daily'

export const SECTION_FORECAST_TYPES = ['hourly', 'daily'] as const satisfies readonly ForecastType[]
export type SectionForecastType = typeof SECTION_FORECAST_TYPES[number]

export interface WeatherForecastEvent {
  forecast?: WeatherForecast[]
  type: ForecastType
}

export interface SunEntity extends HassEntity {
  state: 'above_horizon' | 'below_horizon'
  attributes: {
    next_rising?: string
    next_setting?: string
  }
}

export const WEATHER_ICON_TYPES = ['fill', 'flat', 'line', 'monochrome'] as const
export type WeatherIconType = typeof WEATHER_ICON_TYPES[number]

export interface ClockHandle {
  stop: () => void
}
