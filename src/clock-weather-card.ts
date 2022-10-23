import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  TimeFormat,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import {
  ClockWeatherCardConfig,
  MergedClockWeatherCardConfig,
  MergedWeatherForecast,
  Rgb,
  TemperatureUnit,
  Weather,
  WeatherForecast 
} from './types';
import styles from './styles';
import { actionHandler } from './action-handler-directive';
import { localize } from './localize/localize';
import { HassEntityBase } from 'home-assistant-js-websocket';
import { extractMostOccuring, max, min, round, roundDown, roundUp } from './utils';
import { svg, png } from './images';
import { version } from '../package.json';
import { safeRender } from './helpers';

console.info(
`%c  CLOCK-WEATHER-CARD \n%c Version: ${version}`,
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
  .set(-10, new Rgb(120, 162, 204)) // darker blue
  .set(0, new Rgb(164, 195, 210)) // light blue
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

  constructor() {
    super();
    this.currentDate = new Date();
    const msToNextMinute = (60 - this.currentDate.getSeconds()) * 1000;
    setTimeout(() => setInterval(() => { this.currentDate = new Date() }, 1000 * 60), msToNextMinute);
    setTimeout(() => { this.currentDate = new Date() }, msToNextMinute);
  }

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: ClockWeatherCardConfig): void {
    if (!config) {
      throw new Error(this.localize('common.invalid_configuration'));
    }

    if (!config.entity) {
      throw new Error(this.localize('common.entity_missing'));
    }

    if (config.forecast_days && config.forecast_days < 1) {
      throw new Error(this.localize('common.invalid_forecast_days'));
    }

    if (config.time_format && config.time_format.toString() !== '24' && config.time_format.toString() !== '12') {
      throw new Error(this.localize('common.invalid_time_format'));
    }

    if (config.hide_today_section && config.hide_forecast_section) {
      throw new Error(this.localize('common.invalid_hides'));
    }

    this.config = this.mergeConfig(config);
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult {
    const showToday = !this.config.hide_today_section
    const showForecast = !this.config.hide_forecast_section
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
        ${showToday ? html`
          <clock-weather-card-today>
            ${safeRender(() => this.renderToday())}
          </clock-weather-card-today>` : ''}
        ${showForecast ? html`
          <clock-weather-card-forecast>
            ${safeRender(() => this.renderForecast())}
          </clock-weather-card-forecast>` : ''}
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
    const localizedState = this.localize(`weather.${state}`);
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
    const currentTemp = Math.round(weather.attributes.temperature);
    const days = this.config.forecast_days;

    const dailyForecasts = this.extractDailyForecasts(weather.attributes.forecast, days);

    const minTemps = [...dailyForecasts.map((f) => f.templow), currentTemp];
    const maxTemps = [...dailyForecasts.map((f) => f.temperature), currentTemp];
    const minTemp = Math.round(min(minTemps));
    const maxTemp = Math.round(max(maxTemps));
    const temperatueUnit = weather.attributes.temperature_unit;
    const gradientRange = this.gradientRange(minTemp, maxTemp, temperatueUnit);
    return dailyForecasts.map((forecast) => safeRender(() => this.renderForecastDay(forecast, gradientRange, minTemp, maxTemp, currentTemp)));
  }

  private renderForecastDay(forecast: MergedWeatherForecast, gradientRange: Rgb[], minTemp: number, maxTemp: number, currentTemp: number): TemplateResult {
    const dayText = this.localize(`day.${new Date(forecast.datetime).getDay()}`);
    const weatherState = forecast.condition === 'pouring' ? 'raindrops' : forecast.condition === 'rainy' ? 'raindrop' : forecast.condition;
    const weatherIcon = this.toIcon(weatherState, 'fill', true, 'static');
    const tempUnit = this.getWeather().attributes.temperature_unit;
    const isToday = new Date().getDate() === new Date(forecast.datetime).getDate();
    const minTempDay = Math.round(isToday ? Math.min(currentTemp, forecast.templow) : forecast.templow);
    const maxTempDay = Math.round(isToday ? Math.max(currentTemp, forecast.temperature) : forecast.temperature);
    return html`
      <clock-weather-card-forecast-row>
        ${this.renderText(dayText)}
        ${this.renderIcon(weatherIcon)}
        ${this.renderText(this.toConfiguredTempUnit(tempUnit, minTempDay), 'right')}
        ${this.renderForecastTemperatureBar(gradientRange, minTemp, maxTemp, minTempDay, maxTempDay, currentTemp, isToday)}
        ${this.renderText(this.toConfiguredTempUnit(tempUnit, maxTempDay))}
      </clock-weather-card-forecast-row>
    `;
  }

  private renderText(text: string, textAlign: 'left' | 'center' | 'right' = 'left'): TemplateResult {
    return html`
      <forecast-text style="--text-align: ${textAlign};">
        ${text}
      </forecast-text>
    `;
  }

  private renderIcon(src: string): TemplateResult {
    return html`
      <forecast-icon>
        <img class="grow-img" src=${src} />
      </forecast-icon>
    `;
  }

  private renderForecastTemperatureBar(gradientRange: Rgb[], minTemp: number, maxTemp: number, minTempDay: number, maxTempDay: number, currentTemp: number, isToday: boolean): TemplateResult {
    const { startPercent, endPercent } = this.calculateBarRangePercents(minTemp, maxTemp, minTempDay, maxTempDay)
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
          ${isToday ? this.renderForecastCurrentTemp(minTempDay, maxTempDay, currentTemp) : ''}
        </forecast-temperature-bar-range>
      </forecast-temperature-bar>
    `;
  }

  private renderForecastCurrentTemp(minTempDay: number, maxTempDay: number, currentTemp: number): TemplateResult {
    const indicatorPosition = minTempDay === maxTempDay ? 0 : (100 / (maxTempDay - minTempDay)) * (currentTemp - minTempDay)
    const steps = maxTempDay - minTempDay
    const moveRight = maxTempDay === minTempDay ? 0 : (currentTemp - minTempDay) / steps
    return html`
      <forecast-temperature-bar-current-indicator style="--position: ${indicatorPosition}%;">
        <forecast-temperature-bar-current-indicator-dot style="--move-right: ${moveRight}">
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
      animated_icon: config.animated_icon === undefined ? true : config.animated_icon,
      time_format: config.time_format?.toString() as '12' | '24' | undefined,
      hide_forecast_section: config.hide_forecast_section || false,
      hide_today_section: config.hide_today_section || false,
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
    if (!weather?.attributes?.forecast) throw new Error(this.localize('common.entity_missing'));
    return weather;
  }

  private getSun(): HassEntityBase | undefined {
    return this.hass.states[this.config.sun_entity];
  }

  private getLocale(): string {
    return this.config.locale || this.hass.locale?.language || 'en';
  }

  private date(): string {
    const weekday = this.localize(`day.${this.currentDate.getDay()}`);
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
      hourCycle: this.getTimeFormat()
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

  private getTimeFormat(): 'h12' | 'h23' {
    if (this.config.time_format) {
      return this.config.time_format === '12' ? 'h12' : 'h23'
    }

    if (this.hass.locale?.time_format === TimeFormat.twenty_four) return 'h23'
    if (this.hass.locale?.time_format === TimeFormat.am_pm) return 'h12'
    return 'h23'
  }

  private calculateBarRangePercents(minTemp: number, maxTemp: number, minTempDay: number, maxTempDay: number): { startPercent: number, endPercent: number} {
    if (maxTemp === minTemp) {
      // avoid division by 0
      return { startPercent: 0, endPercent: 100 };
    }
    const startPercent = (100 / (maxTemp - minTemp)) * (minTempDay - minTemp);
    const endPercent = (100 / (maxTemp - minTemp)) * (maxTempDay - minTemp);
    // fix floating point issue
    // (100 / (19 - 8)) * (19 - 8) = 100.00000000000001
    return {
      startPercent: Math.max(0, startPercent),
      endPercent: Math.min(100, endPercent)
    };
  }

  private localize(key: string): string {
    try {
      // might fail if rendering a configuration error, since not all variables were initialized
      return localize(key, this.getLocale());
    } catch (e) {
      const locale = localStorage.getItem('selectedLanguage') || 'en';
      return localize(key, locale);
    }
  }

  private extractDailyForecasts(forecasts: WeatherForecast[], days: number): MergedWeatherForecast[] {
    const agg = forecasts.reduce((forecasts, forecast) => {
      const day = new Date(forecast.datetime).getDate();
      forecasts[day] = forecasts[day] || [];
      forecasts[day].push(forecast);
      return forecasts;
    }, {} as Record<number, WeatherForecast[]>);

    return Object.values(agg)
      .reduce((agg: MergedWeatherForecast[], forecasts) => {
        if (!forecasts.length) return agg;
        const avg = this.calculateAverageDailyForecast(forecasts);
        agg.push(avg);
        return agg;
      }, [])
      .slice(0, days);
  }

  private calculateAverageDailyForecast(forecasts: WeatherForecast[]): MergedWeatherForecast {
    const minTemps = forecasts.map((f) => f.templow || f.temperature || this.getWeather().attributes.temperature);
    const minTemp = min(minTemps);

    const maxTemps = forecasts.map((f) => f.temperature || this.getWeather().attributes.temperature);
    const maxTemp = max(maxTemps);

    const precipitationProbabilities = forecasts.map((f) => f.precipitation_probability || 0);
    const precipitationProbability = max(precipitationProbabilities);

    const precipitations = forecasts.map((f) => f.precipitation || 0);
    const precipitation = max(precipitations);

    const conditions = forecasts.map((f) => f.condition);
    const condition = extractMostOccuring(conditions);

    return {
      temperature: maxTemp,
      templow: minTemp,
      datetime: forecasts[0].datetime,
      condition: condition,
      precipitation_probability: precipitationProbability,
      precipitation: precipitation,
    }
  }
}

