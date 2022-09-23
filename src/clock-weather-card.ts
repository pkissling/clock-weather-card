import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import { ClockWeatherCardConfig, MergedClockWeatherCardConfig, Rgb, Weather, WeatherForecast } from './types';
import styles from './styles';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';
import { HassEntityBase } from 'home-assistant-js-websocket';
import { max, min, round, roundDown, roundUp } from './utils';
import { svg, png } from './images';

console.info(
  `%c  CLOCK-WEATHER-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards = (window as any).customCards || [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards.push({
  type: 'clock-weather-card',
  name: 'Clock Weather Card',
  description: 'A template custom card for you to create something awesome',
});

const gradientMap = new Map()
  .set(-10, new Rgb(155, 203, 227)) // darker blue
  .set(0, new Rgb(155, 203, 227)) // light blue
  .set(10, new Rgb(252, 245, 112)) // yellow
  .set(20, new Rgb(255, 150, 79)) // orange
  .set(30, new Rgb(255, 192, 159)); // red

@customElement('clock-weather-card')
export class ClockWeatherCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('clock-weather-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: MergedClockWeatherCardConfig;
  @state() private currentDate!: Date;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: ClockWeatherCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (!config.entity) {
      throw new Error(localize('common.entity_missing'));
    }

    if (!config.sun_entity) {
      throw new Error(localize('common.sun_entity_missing'));
    }

    if (config.forecast_days && config.forecast_days < 1) {
      throw new Error(localize('common.invalid_forecast_days'));
    }

    this.config = this.mergeConfig(config);
    this.currentDate = new Date();
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    const hass = changedProps.get('hass') as HomeAssistant | undefined;
    if (hass && hass.states['sensor.time'].state !== this.time()) {
      this.currentDate = new Date();
      return true;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult {
    return html`
      <ha-card
        @action=${this.handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        class="clock-weather-card"
        .label=${`Clock Weather Card: ${this.config.entity || 'No Entity Defined'}`}
      >
        <clock-weather-card-today>
          ${this.renderToday()}
        </clock-weather-card-today>
        <clock-weather-card-forecast>
          ${this.renderForecast()}
        </clock-weather-card-forecast>
      </ha-card>
    `;
  }

  private renderToday(): TemplateResult {
    const weather = this.getWeather();
    const state = weather.state;
    const temp = weather.attributes.temperature;
    const tempUnit = weather.attributes.temperature_unit;
    const iconType = this.config.weather_icon_type;
    const icon = this.toIcon(state, iconType, false);
    const localizedState = localize(`weather.${state}`);
    const localizedTemp = Math.round(temp) + tempUnit;

    return html`
      <clock-weather-card-today-left>
        <img class="grow-img" src=${icon} />
      </clock-weather-card-today-left>
      <clock-weather-card-today-right>
        <clock-weather-card-today-right-wrap>
          <clock-weather-card-today-right-wrap-top>
            ${localizedState}, ${localizedTemp}
          </clock-weather-card-today-right-wrap-top>
          <clock-weather-card-today-right-wrap-center>
            ${this.time()}
          </clock-weather-card-today-right-wrap-center>
          <clock-weather-card-today-right-wrap-bottom>
            ${this.date()}
          </clock-weather-card-today-right-wrap-bottom>
        </clock-weather-card-today-right-wrap>
      </clock-weather-card-today-right>`;
  }

  private renderForecast(): TemplateResult[] {
    const weather = this.getWeather();
    const days = this.config.forecast_days;
    const minTemps = weather.attributes.forecast
      .slice(0, days)
      .map((f) => f.templow);
    const maxTemps = weather.attributes.forecast
      .slice(0, days)
      .map((f) => f.temperature);
    const minTemp = Math.round(min(minTemps));
    const maxTemp = Math.round(max(maxTemps));
    const gradientRange = this.gradientRange(minTemp, maxTemp);
    return weather.attributes.forecast
      .slice(0, days)
      .map((forecast) => this.renderForecastDay(forecast, gradientRange, minTemp, maxTemp));
  }

  private renderForecastDay(forecast: WeatherForecast, gradientRange: Rgb[], minTemp: number, maxTemp: number): TemplateResult {
    const dayText = localize(`day.${new Date(forecast.datetime).getDay()}`);
    const weatherIcon = this.toIcon(forecast.condition, 'fill', true);
    const tempUnit = this.getWeather().attributes.temperature_unit;
    const minTempDay = Math.round(forecast.templow);
    const maxTempDay = Math.round(forecast.temperature);
    return html`
      <clock-weather-card-forecast-row>
      ${this.renderText(dayText)}
      ${this.renderIcon(weatherIcon)}
      ${this.renderText(minTempDay + tempUnit, 'right')}
      ${this.renderForecastTemperatureBar(forecast, gradientRange, minTemp, maxTemp, minTempDay, maxTempDay)}
      ${this.renderText(maxTempDay + tempUnit)}
    </clock-weather-card-forecast-row>`;
  }

  private renderText(text: string, textAlign: 'left' | 'center' | 'right' = 'left'): TemplateResult {
    return html`
      <div style="text-align: ${textAlign}">
        ${text}
      </div>
    `;
  }

  private renderIcon(src: string): TemplateResult {
    return html`
      <forecast-icon>
        <img class="grow-img" src=${src} />
      </forecast-icon>
    `;
  }

  private renderForecastTemperatureBar(forecast: WeatherForecast, gradientRange: Rgb[], minTemp: number, maxTemp: number, minTempDay: number, maxTempDay: number): TemplateResult {
    const tempStartPercent = (100 / (maxTemp - minTemp)) * (minTempDay - minTemp);
    const tempEndPercent = (100 / (maxTemp - minTemp)) * (maxTempDay - minTemp);
    return html`
      <forecast-temperature-bar>
        <forecast-temperature-bar-background> </forecast-temperature-bar-background>
        <forecast-temperature-bar-range
          style="--start-percent: ${tempStartPercent}%; --end-percent: ${tempEndPercent}%; --gradient: ${this.gradient(
            gradientRange,
            tempStartPercent,
            tempEndPercent,
          )};"
        >
          ${this.renderForecastCurrentTemp(forecast, minTempDay, maxTempDay)}
        </forecast-temperature-bar-range>
      </forecast-temperature-bar>
    `;
  }

  private renderForecastCurrentTemp(forecast: WeatherForecast, minTempDay: number, maxTempDay: number): TemplateResult {
    const isToday = new Date().getDay() === new Date(forecast.datetime).getDay();
    if (!isToday) {
      return html``;
    }
    const weather = this.getWeather();
    const currentTemp = Math.round(weather.attributes.temperature);
    const indicatorPosition = isToday ? (100 / (maxTempDay - minTempDay)) * (currentTemp - minTempDay) : '';
    const tempUnit = weather.attributes.temperature_unit;
    if (!indicatorPosition) {
      return html``;
    }

    return html`
      <forecast-temperature-bar-current-indicator style="--position: ${indicatorPosition}%;">
        <forecast-temperature-bar-current-indicator-bar>
        </forecast-temperature-bar-current-indicator-bar>
        <forecast-temperature-bar-current-indicator-temp style="${indicatorPosition > 50 ? '--right: 100%' : '--left: 100%'}">
          ${currentTemp}${tempUnit}
        </forecast-temperature-bar-current-indicator-temp>
      </forecast-temperature-bar-current-indicator>
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return styles;
  }

  private gradientRange(minTemp: number, maxTemp: number): Rgb[] {
    const minVal = Math.max(roundDown(minTemp, 10), min([...gradientMap.keys()]));
    const maxVal = Math.min(roundUp(maxTemp, 10), max([...gradientMap.keys()]));
    return Array.from(gradientMap.keys())
      .filter((temp) => temp >= minVal && temp <= maxVal)
      .map((temp) => gradientMap.get(temp));
  }

  private gradient(rgbs: Rgb[], fromPercent: number, toPercent: number): string {
    const [fromRgb, fromIndex] = this.calculateRgb(rgbs, fromPercent);
    const [toRgb, toIndex] = this.calculateRgb(rgbs, toPercent);
    const between = rgbs.slice(fromIndex + 1, toIndex);

    return [fromRgb, ...between, toRgb]
      .map((rgb) => `rgb(${rgb.r},${rgb.g},${rgb.b})`)
      .join(',');
  }

  private calculateRgb(rgbs: Rgb[], percent: number): [rgb: Rgb, index: number] {
    function valueAtPosition(start: number, end: number, percent: number): number {
      const abs = Math.abs(start - end);
      const value = (abs / 100) * percent;
      if (start > end) {
        return round(start - value);
      } else {
        return round(start + value);
      }
    }

    function rgbAtPosition(start: Rgb, end: Rgb, percent: number): Rgb {
      const r = valueAtPosition(start.r, end.r, percent);
      const g = valueAtPosition(start.g, end.g, percent);
      const b = valueAtPosition(start.b, end.b, percent);
      return new Rgb(r, g, b);
    }

    if (percent === 0) {
      const index = 0;
      return [rgbAtPosition(rgbs[index], rgbs[index], percent), index];
    }

    if (percent === 100) {
      const index = rgbs.length - 1;
      return [rgbAtPosition(rgbs[index], rgbs[index], percent), index];
    }

    const steps = 100 / (rgbs.length - 1);
    const index = Math.floor(percent / steps);
    const start = rgbs[index];
    const end = rgbs[index + 1];
    const percentInStep = (100 / steps) * (percent - index * steps);
    const rgb = rgbAtPosition(start, end, percentInStep);
    return [rgb, index];
  }
  private handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private mergeConfig(config: ClockWeatherCardConfig): MergedClockWeatherCardConfig {
    return {
      ...config,
      sun_entity: config.sun_entity || 'sun.sun',
      weather_icon_type: config.weather_icon_type || 'line',
      forecast_days: config.forecast_days || 5,
      animated_icons: config.animated_icons || true,
    };
  }

  private toIcon(weatherState: string, type: 'fill' | 'line', forceDay: boolean): string {
    const daytime = forceDay ? 'day' : this.getSun().state === 'above_horizon' ? 'day' : 'night';
    const map = this.config.animated_icons ? svg : png;
    const icon = map[type][weatherState];
    return icon?.[daytime] || icon;
  }

  private getWeather(): Weather {
    const weather = this.hass.states[this.config.entity] as Weather | undefined;
    if (!weather?.attributes?.forecast) throw new Error(localize('common.entity_missing'));
    return weather;
  }

  private getSun(): HassEntityBase {
    const sun = this.hass.states[this.config.sun_entity] as HassEntityBase | undefined;
    if (!sun) throw new Error(localize('common.sun_entity_missing'));
    return sun;
  }

  private getLocale(): string {
    return this.config.locale || this.hass?.locale?.language || 'en';
  }

  private date(): string {
    return this.currentDate.toLocaleDateString(this.getLocale(), {
      weekday: 'short',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private time(): string {
    return this.currentDate.toLocaleTimeString(this.getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
