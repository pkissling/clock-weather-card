import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import { ClockWeatherCardConfig, MergedClockWeatherCardConfig, Rgb, TemperatureUnit, Weather, WeatherForecast } from './types';
import styles from './styles';
import { actionHandler } from './action-handler-directive';
import { localize } from './localize/localize';
import { HassEntityBase } from 'home-assistant-js-websocket';
import { max, min, round, roundDown, roundUp } from './utils';
import { svg, png } from './images';
import { version } from '../package.json';

console.info(
`%c  CLOCK-WEATHER-CARD \n%c  ${localize('common.version')} ${version}    `,
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
  description: 'Shows the current date/time in combination with the current weather and an iOS insipired weather forecast.',
});

const gradientMap: Map<number, Rgb> = new Map()
  .set(-10, new Rgb(155, 203, 227)) // darker blue
  .set(0, new Rgb(155, 203, 227)) // light blue
  .set(10, new Rgb(121, 210 ,179)) // turquoise
  .set(20, new Rgb(252, 245, 112)) // yellow
  .set(30, new Rgb(255, 150, 79)) // orange
  .set(40, new Rgb(255, 192, 159)); // red

@customElement('clock-weather-card')
export class ClockWeatherCard extends LitElement {
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
    const icon = this.toIcon(state, iconType, false, this.getIconAnimationKind());
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
    const temperatueUnit = weather.attributes.temperature_unit
    const gradientRange = this.gradientRange(minTemp, maxTemp, temperatueUnit);
    return weather.attributes.forecast
      .slice(0, days)
      .map((forecast) => this.renderForecastDay(forecast, gradientRange, minTemp, maxTemp));
  }

  private renderForecastDay(forecast: WeatherForecast, gradientRange: Rgb[], minTemp: number, maxTemp: number): TemplateResult {
    const dayText = localize(`day.${new Date(forecast.datetime).getDay()}`);
    const weatherState = forecast.condition === 'pouring' ? 'raindrops' : forecast.condition === 'rainy' ? 'raindrop' : forecast.condition;
    const weatherIcon = this.toIcon(weatherState, 'fill', true, 'static');
    const tempUnit = this.getWeather().attributes.temperature_unit;
    const minTempDay = Math.round(forecast.templow);
    const maxTempDay = Math.round(forecast.temperature);
    return html`
      <clock-weather-card-forecast-row>
        ${this.renderText(dayText)}
        ${this.renderIcon(weatherIcon)}
        ${this.renderText(this.toConfiguredTempUnit(tempUnit, minTempDay), 'right')}
        ${this.renderForecastTemperatureBar(forecast, gradientRange, minTemp, maxTemp, minTempDay, maxTempDay)}
        ${this.renderText(this.toConfiguredTempUnit(tempUnit, maxTempDay))}
      </clock-weather-card-forecast-row>
    `;
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
    const { startPercent, endPercent } = this.calculateBarRangePercents(minTemp, maxTemp, minTempDay, maxTempDay);
    return html`
      <forecast-temperature-bar>
        <forecast-temperature-bar-background> </forecast-temperature-bar-background>
        <forecast-temperature-bar-range
          style="--start-percent: ${startPercent}%; --end-percent: ${endPercent}%; --gradient: ${this.gradient(
            gradientRange,
            startPercent,
            endPercent,
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
    const indicatorPosition = isToday ? (100 / (maxTempDay - minTempDay)) * (currentTemp - minTempDay) : null;
    if (indicatorPosition === null) {
      return html``;
    }

    return html`
      <forecast-temperature-bar-current-indicator style="--position: ${indicatorPosition}%;">
        <forecast-temperature-bar-current-indicator-dot style="--move-left: ${indicatorPosition > 50 ? '1' : '0'}">
        </forecast-temperature-bar-current-indicator-dot>
      </forecast-temperature-bar-current-indicator>
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return styles;
  }

  private gradientRange(minTemp: number, maxTemp: number, temperatureUnit: TemperatureUnit): Rgb[] {
    const minTempCelsius = this.toCelsius(temperatureUnit, minTemp)
    const maxTempCelsius = this.toCelsius(temperatureUnit, maxTemp)
    const minVal = Math.max(roundDown(minTempCelsius, 10), min([...gradientMap.keys()]));
    const maxVal = Math.min(roundUp(maxTempCelsius, 10), max([...gradientMap.keys()]));
    return Array.from(gradientMap.keys())
      .filter((temp) => temp >= minVal && temp <= maxVal)
      .map((temp) => gradientMap.get(temp) as Rgb);
  }

  private gradient(rgbs: Rgb[], fromPercent: number, toPercent: number): string {
    const [fromRgb, fromIndex] = this.calculateRgb(rgbs, fromPercent, 'left');
    const [toRgb, toIndex] = this.calculateRgb(rgbs, toPercent, 'right');
    const between = rgbs.slice(fromIndex + 1, toIndex);

    return [fromRgb, ...between, toRgb]
      .map((rgb) => `rgb(${rgb.r},${rgb.g},${rgb.b})`)
      .join(',');
  }

  private calculateRgb(rgbs: Rgb[], percent: number, pickIndex: 'left' | 'right'): [rgb: Rgb, index: number] {
    function valueAtPosition(start: number, end: number, percent: number): number {
      const abs = Math.abs(start - end);
      const value = (abs / 100) * percent;
      if (start > end) {
        return round(start - value);
      } else {
        return round(start + value);
      }
    }

    function rgbAtPosition(startIndex: number, endIndex: number, percentToNextIndex: number, rgbs: Rgb[]): Rgb {
      const start = rgbs[startIndex];
      const end = rgbs[endIndex];
      const percent = percentToNextIndex < 0 ? 100 + percentToNextIndex : percentToNextIndex;
      const left = percentToNextIndex < 0 ? end : start;
      const right = percentToNextIndex < 0 ? start : end;
      const r = valueAtPosition(left.r, right.r, percent);
      const g = valueAtPosition(left.g, right.g, percent);
      const b = valueAtPosition(left.b, right.b, percent);
      return new Rgb(r, g, b);
    }

    const steps = 100 / (rgbs.length - 1);
    const step = percent / steps;
    const startIndex = Math.round(step);
    const percentToNextIndex = (100 / steps) * (percent - startIndex * steps);
    const endIndex = percentToNextIndex === 0 ? startIndex : percentToNextIndex < 0 ? startIndex - 1 : startIndex + 1;
    const rgb = rgbAtPosition(startIndex, endIndex, percentToNextIndex, rgbs);
    const index = pickIndex === 'left' ? Math.min(startIndex, endIndex) : Math.max(startIndex, endIndex);
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
      animated_icon: config.animated_icons || true,
    };
  }

  private toIcon(weatherState: string, type: 'fill' | 'line', forceDay: boolean, kind: 'static' | 'animated'): string {
    const daytime = forceDay ? 'day' : this.getSun()?.state === 'below_horizon' ? 'night' : 'day';
    const iconMap = kind === 'animated' ? svg : png;
    const icon = iconMap[type][weatherState];
    return icon?.[daytime] || icon;
  }

  private getWeather(): Weather {
    const weather = this.hass.states[this.config.entity] as Weather | undefined;
    if (!weather?.attributes?.forecast) throw new Error(localize('common.entity_missing'));
    return weather;
  }

  private getSun(): HassEntityBase | undefined {
    return this.hass.states[this.config.sun_entity];
  }

  private getLocale(): string {
    return this.config.locale || this.hass?.locale?.language || 'en';
  }

  private date(): string {
    const weekday = localize(`day.${this.currentDate.getDay()}`);
    const date = this.currentDate.toLocaleDateString(this.getLocale(), {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    });
    return `${weekday}, ${date}`
  }

  private time(): string {
    return this.currentDate.toLocaleTimeString(this.getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getIconAnimationKind(): 'static' | 'animated' {
    return this.config.animated_icon ? 'animated' : 'static'
  }

  private toCelsius(temperatueUnit: TemperatureUnit, temperature: number): number {
    return temperatueUnit === '°C' ? temperature : Math.round((temperature - 32) * (5/9))
  }

  private toFahrenheit(temperatueUnit: TemperatureUnit, temperature: number): number {
    return temperatueUnit === '°F' ? temperature : Math.round((temperature * 9/5) + 32)
  }

  private getConfiguredTemperatureUnit(): TemperatureUnit {
    return this.hass.config.unit_system.temperature as TemperatureUnit
  }

  private toConfiguredTempUnit(unit: TemperatureUnit, temp: number): string {
    const configuredUnit = this.getConfiguredTemperatureUnit()
    if (configuredUnit === unit) {
      return temp + unit
    }

    return unit === '°C'
      ? this.toFahrenheit(unit, temp) + '°F'
      : this.toCelsius(unit, temp) + '°C'
  }

  private calculateBarRangePercents(minTemp: number, maxTemp: number, minTempDay: number, maxTempDay: number): { startPercent: number, endPercent: number} {
    let startPercent = (100 / (maxTemp - minTemp)) * (minTempDay - minTemp);
    let endPercent = (100 / (maxTemp - minTemp)) * (maxTempDay - minTemp);
    if (Math.round(startPercent) === Math.round(endPercent)) {
      startPercent -= 2.5;
      endPercent += 2.5;
    }
    // fix floating point issue
    // (100 / (19 - 8)) * (19 - 8) = 100.00000000000001
    return {
      startPercent: Math.max(0, startPercent),
      endPercent: Math.min(100, endPercent)
    };
  }
}

