import { type LovelaceCard, type LovelaceCardConfig, type LovelaceCardEditor } from 'custom-card-helpers'
import { type HassEntity } from 'home-assistant-js-websocket/dist/types'
import { type DateTime } from 'luxon'

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

export interface ClockWeatherCardConfig extends LovelaceCardConfig {
  entity: string
  title?: string
  sun_entity?: string
  weather_icon_type?: WeatherIconType
  animated_icon?: boolean
}

export interface MergedClockWeatherCardConfig {
  entity: string
  title: string | null
  sun_entity: string
  weather_icon_type: WeatherIconType
  animated_icon: boolean
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

export type WeatherIconType = 'fill' | 'line' | 'monochrome'
