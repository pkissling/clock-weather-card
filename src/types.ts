import { type LovelaceCard, type LovelaceCardConfig, type LovelaceCardEditor } from 'custom-card-helpers'
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
  }

  interface HTMLElementTagNameMap {
    'clock-weather-card-editor': LovelaceCardEditor
    'hui-error-card': LovelaceCard
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
}

export interface EntitySegmentConfig {
  type: 'entity'
  entity_id: string
  attribute?: string
  show_unit?: boolean
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

export interface RowConfig {
  segments: SegmentConfig[]
  font_size?: string
}

// Card configs
export interface ClockWeatherCardConfig extends LovelaceCardConfig {
  entity: string
  title?: string
  sun_entity?: string
  weather_icon_type?: WeatherIconType
  time_zone?: string
  locale?: string
  sections?: {
    header?: {
      hide?: boolean
      animated_icons?: boolean
      weather_icon_type?: WeatherIconType
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
      weather_icon_type?: WeatherIconType
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
  header: ResolvedHeaderConfig
  forecastStrip: ResolvedForecastStripConfig
  forecastList: ResolvedForecastListConfig
}

export interface ResolvedHeaderConfig {
  hidden: boolean
  rows: RowConfig[]
  animatedIcons: boolean
  weatherIconType: WeatherIconType
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
}

export interface ResolvedForecastListConfig {
  hidden: boolean
  entity: string
  forecastType: SectionForecastType
  count: number
  animatedIcons: boolean
  roundTemperatures: boolean
  weatherIconType: WeatherIconType
  rowHeight: string | null
  barThickness: string
  hideCurrentTempIndicator: boolean
  gradient: Record<number | string, string>
}

export const enum WeatherEntityFeature {
  FORECAST_DAILY = 1,
  FORECAST_HOURLY = 2,
  FORECAST_TWICE_DAILY = 4,
}

export interface Weather extends HassEntity {
  state: string
  attributes: {
    temperature?: number
    temperature_unit: TemperatureUnit
    humidity?: number
    precipitation_unit: string
    forecast?: WeatherForecast[]
    supported_features: WeatherEntityFeature
  }
}

export type TemperatureUnit = '°C' | '°F'

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
  precipitationProbability: number | null
  showPrecipitation: boolean
} & (
  | { temperature: number, temperatureLow: number | null, temperatureUnit: string | null, sunEvent?: never }
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
  temperatureLow: number | string
  temperatureHigh: number | string
  temperatureUnit: string | null
  barLowPercent: number
  barHighPercent: number
  gradientStops: GradientStop[]
  showCurrentIndicator: boolean
  currentTempPercent: number
}


export interface TemperatureSensor extends HassEntity {
  state: string
  attributes: {
    unit_of_measurement?: TemperatureUnit
  }
}

export interface HumiditySensor extends HassEntity {
  state: string
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
    elevation?: number
  }
}

export const WEATHER_ICON_TYPES = ['fill', 'flat', 'line', 'monochrome'] as const
export type WeatherIconType = typeof WEATHER_ICON_TYPES[number]

export interface ClockHandle {
  stop: () => void
}
