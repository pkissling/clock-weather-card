import { LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket/dist/types';

declare global {
  interface HTMLElementTagNameMap {
    'clock-weather-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

export interface ClockWeatherCardConfig extends LovelaceCardConfig {
  entity: string;
  title?: string;
  sun_entity?: string;
  weather_icon_type?: 'fill' | 'line';
  animated_icon?: boolean;
  forecast_days?: number;
  locale?: string;
  time_format?: '12' | '24';
  date_pattern?: string;
  hide_today_section?: boolean;
  hide_forecast_section?: boolean;
  forecast_hourly?: boolean;
}

export interface MergedClockWeatherCardConfig extends LovelaceCardConfig {
  entity: string;
  title?: string;
  sun_entity: string;
  weather_icon_type: 'fill' | 'line';
  animated_icon: boolean;
  forecast_days: number;
  locale?: string;
  time_format?: '12' |'24';
  date_pattern: string;
  hide_today_section: boolean;
  hide_forecast_section: boolean;
  forecast_hourly: boolean;
}

export interface Weather extends HassEntity {
  state: string;
  attributes: {
    temperature: number;
    temperature_unit: TemperatureUnit;
    precipitation_unit: string;
    forecast: WeatherForecast[];
  };
}

export type TemperatureUnit = '°C' | '°F';

export type WeatherForecast = {
  datetime: string;
  condition: string;
  temperature: number | null;
  precipitation: number | null;
  precipitation_probability: number | null;
  templow: number | null;
}

export type MergedWeatherForecast = {
  datetime: Date;
  condition: string;
  temperature: number;
  precipitation: number;
  precipitation_probability: number;
  templow: number;
}

export class Rgb {
  r: number;
  g: number;
  b: number;

  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
}
