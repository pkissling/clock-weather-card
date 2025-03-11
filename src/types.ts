import { type LovelaceCard, type LovelaceCardConfig, type LovelaceCardEditor } from 'custom-card-helpers'
import { type HassEntity } from 'home-assistant-js-websocket/dist/types'
import { type DateTime } from 'luxon'

declare global {
  interface HTMLElementTagNameMap {
    'clock-weather-card-editor': LovelaceCardEditor
    'hui-error-card': LovelaceCard
  }
}

export interface ClockWeatherCardConfig extends LovelaceCardConfig {
  entity: string
  title?: string
  sun_entity?: string
  temperature_sensor?: string
  humidity_sensor?: string
  weather_icon_type?: 'fill' | 'line'
  animated_icon?: boolean
  forecast_rows?: number
  locale?: string
  time_format?: '12' | '24'
  time_pattern?: string
  date_pattern?: string
  hide_today_section?: boolean
  hide_forecast_section?: boolean
  hide_summary_section?: boolean
  show_humidity?: boolean
  hourly_forecast?: boolean
  hide_clock?: boolean
  hide_date?: boolean
  use_browser_time?: boolean
  time_zone?: string
  show_decimal?: boolean
  apparent_sensor?: string
  aqi_sensor?: string
  summary_sensor?: string
}

export interface MergedClockWeatherCardConfig extends LovelaceCardConfig {
  entity: string
  title?: string
  sun_entity: string
  temperature_sensor?: string
  humidity_sensor?: string
  weather_icon_type: 'fill' | 'line'
  animated_icon: boolean
  forecast_rows: number
  locale?: string
  time_format?: '12' | '24'
  time_pattern?: string
  date_pattern: string
  hide_today_section: boolean
  hide_forecast_section: boolean
  hide_summary_section: boolean
  show_humidity: boolean
  hourly_forecast: boolean
  hide_clock: boolean
  hide_date: boolean
  use_browser_time: boolean
  time_zone?: string
  show_decimal: boolean
  apparent_sensor?: string
  aqi_sensor?: string
  summary_sensor?: string
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
  condition: string
  temperature: number | null
  humidity?: number | null
  precipitation: number | null
  precipitation_probability: number | null
  templow: number | null
}

export interface MergedWeatherForecast {
  datetime: DateTime
  condition: string
  temperature: number
  precipitation: number
  precipitation_probability: number
  templow: number
}

export class Rgb {
  r: number
  g: number
  b: number

  constructor (r: number, g: number, b: number) {
    this.r = r
    this.g = g
    this.b = b
  }

  toRgbString (): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`
  }
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

export interface WeatherForecastEvent {
  forecast?: WeatherForecast[]
  type: 'hourly' | 'daily' | 'twice_daily'
}
