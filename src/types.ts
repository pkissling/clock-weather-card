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
  sun_entity?: string;
  weather_icon_type?: 'fill' | 'line';
  animated_icons?: boolean;
  forecast_days?: number;
  locale?: string;
}

export interface MergedClockWeatherCardConfig extends LovelaceCardConfig {
  entity: string;
  sun_entity: string;
  weather_icon_type: 'fill' | 'line';
  animated_icons: boolean;
  forecast_days: number;
  locale?: string;
}

export interface Weather extends HassEntity {
  state: string;
  attributes: {
    temperature: number;
    temperature_unit: string;
    precipitation_unit: string;
    forecast: WeatherForecast[];
  };
}

export interface WeatherForecast {
  temperature: number;
  templow: number;
  precipitation: number;
  datetime: string;
  condition: string;
  precipitation_probability: number;
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
