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

export interface SpacerSegmentConfig {
  type: 'spacer'
}

export type SegmentConfig =
  | TimeSegmentConfig
  | DateSegmentConfig
  | WeatherSegmentConfig
  | EntitySegmentConfig
  | IconSegmentConfig
  | SpacerSegmentConfig

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
  animated_icon?: boolean
  time_zone?: string
  locale?: string
  rows?: RowConfig[]
  sections?: {
    hourly_forecast?: {
      hide?: boolean
      weather_entity?: string
      hours?: number
      animated_icons?: boolean
      round_temperatures?: boolean
      weather_icon_type?: WeatherIconType
    }
  }
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
  precipitation_probability?: number | null
}

export interface DailyWeatherForecast extends WeatherForecast {
  templow: number
}

export interface HourlyForecastItem {
  label: string
  condition: string
  isNight: boolean
  animatedIcon: boolean
  weatherIconType: WeatherIconType
  temperature: number
  temperatureUnit: string | null
  precipitationProbability: number | null
  showPrecipitation: boolean
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
