import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  TemperatureSensor,
  TemperatureUnit,
  Weather,
  WeatherForecast
} from './types';
import styles from './styles';
import { actionHandler } from './action-handler-directive';
import { localize } from './localize/localize';
import { HassEntityBase } from 'home-assistant-js-websocket';
import { extractMostOccuring, max, min, round, roundDown, roundIfNotNull, roundUp } from './utils';
import { svg, png } from './images';
import { version } from '../package.json';
import { safeRender } from './helpers';
import { format, Locale } from 'date-fns';
import * as locales from 'date-fns/locale';
import { DateTime } from 'luxon';

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    window.addEventListener('load', () => this.reloadStyles());
    this.currentDate = new Date();
    const msToNextMinute = (60 - this.currentDate.getSeconds()) * 1000;
    setTimeout(() => setInterval(() => { this.currentDate = new Date() }, 1000 * 60), msToNextMinute);
    setTimeout(() => { this.currentDate = new Date() }, msToNextMinute);
  }

  private reloadStyles() {
    const hass = this._hass;
    hass.callService("lovelace", "reload_resources");
  }

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: ClockWeatherCardConfig): void {
    if (!config) {
      throw new Error('Invalid configuration.');
    }

    if (!config.entity) {
      throw new Error('Attribute "entity" must be present.');
    }

    if (config.forecast_days && config.forecast_days < 1) {
      throw new Error('Attribute "forecast_days" must be greater than 0.');
    }

    if (config.time_format && config.time_format.toString() !== '24' && config.time_format.toString() !== '12') {
      throw new Error('Attribute "time_format" must either be "12" or "24".');
    }

    if (config.hide_today_section && config.hide_forecast_section) {
      throw new Error('Attributes "hide_today_section" and "hide_forecast_section" must not enabled at the same time.');
    }

    this.config = this.mergeConfig(config);
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    if (oldHass) {
      const oldSun = oldHass.states[this.config.sun_entity];
      const newSun = this.hass?.states[this.config.sun_entity];
      if (oldSun !== newSun) {
        return true;
      }
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
        ${this.config.title ? html`
          <div class="card-header">
            ${this.config.title}
          </div>` : '' }
        <div class="card-content">
          ${showToday ? html`
            <clock-weather-card-today>
              ${safeRender(() => this.renderToday())}
            </clock-weather-card-today>` : ''}
          ${showForecast ? html`
            <clock-weather-card-forecast>
              ${safeRender(() => this.renderForecast())}
            </clock-weather-card-forecast>` : ''}
        </div>
      </ha-card>
    `;
  }


  private renderToday(): TemplateResult {
    const weather = this.getWeather();
    const state = weather.state;
    const temp = roundIfNotNull(this.getCurrentTemperature());
    const tempUnit = weather.attributes.temperature_unit;
    const iconType = this.config.weather_icon_type;
    const icon = this.toIcon(state, iconType, false, this.getIconAnimationKind());
    const weatherString = this.localize(`weather.${state}`);
    const localizedTemp = temp !== null ? this.toConfiguredTempWithUnit(tempUnit, temp) : null

    return html`
      <style>
        ha-card {
        --bar-height: 1.5rem;
        height: 100%;
        color: white;
        background: rgba(125, 125, 125, 0.8);
        }
        
      clock-weather-card-today-right-wrap-top {
        width: 200%;
        text-align: end;
        display: block;
        color: white;
        font-size: 4rem;
        margin-bottom: 20px;
        margin-left: -240px;
        -webkit-text-stroke: 0.5px black; /* for webkit browsers */
        text-stroke: 2px black;
      }
      clock-weather-card-today-right-wrap-center {
       display: flex;
       height: 4rem;
       font-size: 6rem;
       white-space: nowrap;
       align-items: center;
       justify-content: center;
       color: white;
       -webkit-text-stroke: 0.5px black; /* for webkit browsers */
       text-stroke: 2px black;
       position: relative;
     }
    clock-weather-card-today-right-wrap-bottom {
     display: flex;
     justify-content: start;
     color: white;
     font-size: 3rem;
     -webkit-text-stroke: 0.5px black; /* for webkit browsers */
     text-stroke: 2px black;
     margin-top: 10px;
     margin-left: -90px;
     }

    </style>
      <clock-weather-card-today-left>
        <img class="grow-img" src=${icon} />
      </clock-weather-card-today-left>
      <clock-weather-card-today-right>
        <clock-weather-card-today-right-wrap>
          <clock-weather-card-today-right-wrap-top style="
            width: 200%;
            text-align: end;
            display: block;
            color: white;
            font-size: 4rem;
            margin-bottom: 20px;
            margin-left: -240px;
            -webkit-text-stroke: 0.5px black;
            text-stroke: 2px black;">
           ${this.config.hide_clock ? weatherString : localizedTemp ? `${weatherString}, ${localizedTemp}` : weatherString}
          </clock-weather-card-today-right-wrap-top>
          <clock-weather-card-today-right-wrap-center>
            ${this.config.hide_clock ? localizedTemp ?? 'n/a' : this.time()}
          </clock-weather-card-today-right-wrap-center>
          <clock-weather-card-today-right-wrap-bottom>
            ${this.config.hide_date ? '' : this.date() }
          </clock-weather-card-today-right-wrap-bottom>
        </clock-weather-card-today-right-wrap>
      </clock-weather-card-today-right>`;
  }

  private renderForecast(): TemplateResult[] {
    const weather = this.getWeather();
    const currentTemp = roundIfNotNull(this.getCurrentTemperature());
    const items = this.config.forecast_days;
    const hourly = this.config.hourly_forecast;
    const temperatureUnit = weather.attributes.temperature_unit;

    const forecasts = this.extractForecasts(weather.attributes.forecast, items, hourly);

    const minTemps = forecasts.map((f) => f.templow);
    const maxTemps = forecasts.map((f) => f.temperature);
    if (currentTemp !== null) {
      minTemps.push(currentTemp);
      maxTemps.push(currentTemp);
    }
    const minTemp = Math.round(min(minTemps));
    const maxTemp = Math.round(max(maxTemps));
    
    const gradientRange = this.gradientRange(minTemp, maxTemp, temperatureUnit);
    return forecasts.map((forecast) => safeRender(() => this.renderForecastItem(forecast, gradientRange, minTemp, maxTemp, currentTemp, hourly)));
  }

  private renderForecastItem(forecast: MergedWeatherForecast, gradientRange: Rgb[], minTemp: number, maxTemp: number, currentTemp: number | null, hourly: boolean): TemplateResult {
    const twelveHour = this.getTimeFormat() === '12';
    const displayText = !hourly ? this.localize('day.' + forecast.datetime.getDay()) : this.time(forecast.datetime);
    const weatherState = forecast.condition === 'pouring' ? 'raindrops' : forecast.condition === 'rainy' ? 'raindrop' : forecast.condition;
    const weatherIcon = this.toIcon(weatherState, 'fill', true, 'static');
    const tempUnit = this.getWeather().attributes.temperature_unit;
    const isNow = !hourly ? new Date().getDate() === forecast.datetime.getDate() : new Date().getHours() === forecast.datetime.getHours();
    const minTempDay = Math.round(isNow && currentTemp !== null ? Math.min(currentTemp, forecast.templow) : forecast.templow);
    const maxTempDay = Math.round(isNow && currentTemp !== null ? Math.max(currentTemp, forecast.temperature) : forecast.temperature);
    const colOneSize = hourly && twelveHour ? '3rem' : hourly ? '2.5rem' : '2rem';
    
    return html`
      <clock-weather-card-forecast-row style="--col-one-size: ${colOneSize};">
        ${this.renderText(displayText)}
        ${this.renderIcon(weatherIcon)}
        ${this.renderText(this.toConfiguredTempWithUnit(tempUnit, minTempDay), 'right')}
        ${this.renderForecastTemperatureBar(gradientRange, minTemp, maxTemp, minTempDay, maxTempDay, isNow, currentTemp)}
        ${this.renderText(this.toConfiguredTempWithUnit(tempUnit, maxTempDay))}
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

  private renderForecastTemperatureBar(gradientRange: Rgb[], minTemp: number, maxTemp: number, minTempDay: number, maxTempDay: number, isNow: boolean, currentTemp: number | null): TemplateResult {
    const { startPercent, endPercent } = this.calculateBarRangePercents(minTemp, maxTemp, minTempDay, maxTempDay)
    const moveRight = maxTemp === minTemp ? 0 : (minTempDay - minTemp) / (maxTemp - minTemp)
    return html`
      <forecast-temperature-bar>
        <forecast-temperature-bar-background> </forecast-temperature-bar-background>
        <forecast-temperature-bar-range
          style="--move-right: ${moveRight}; --start-percent: ${startPercent}%; --end-percent: ${endPercent}%; --gradient: ${this.gradient(
            gradientRange,
            startPercent,
            endPercent,
          )};"
        >
          ${isNow ? this.renderForecastCurrentTemp(minTempDay, maxTempDay, currentTemp) : ''}
        </forecast-temperature-bar-range>
      </forecast-temperature-bar>
    `;
  }

  private renderForecastCurrentTemp(minTempDay: number, maxTempDay: number, currentTemp: number | null): TemplateResult {
    if (currentTemp == null) {
      return html``;
    }
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
      sun_entity: config.sun_entity ?? 'sun.sun',
      temperature_sensor: config.temperature_sensor,
      weather_icon_type: config.weather_icon_type ?? 'line',
      forecast_days: config.forecast_days ?? 5,
      hourly_forecast: config.hourly_forecast ?? false,
      animated_icon: config.animated_icon ?? true,
      time_format: config.time_format?.toString() as '12' | '24' | undefined,
      hide_forecast_section: config.hide_forecast_section ?? false,
      hide_today_section: config.hide_today_section ?? false,
      hide_clock: config.hide_clock ?? false,
      hide_date: config.hide_date ?? false,
      date_pattern: config.date_pattern ?? 'P',
      use_browser_time: config.use_browser_time ?? true
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
    if (!weather) throw new Error('Weather entity could not be found.');
    if (!weather?.attributes?.forecast) throw new Error('Weather entity does not have attribute "forecast".');
    return weather;
  }

  private getCurrentTemperature(): number | null {
    if (this.config.temperature_sensor) {
      const temperatueSensor = this.hass.states[this.config.temperature_sensor] as TemperatureSensor | undefined;
      const temp = temperatueSensor?.state ? parseFloat(temperatueSensor.state) : undefined;
      const unit = temperatueSensor?.attributes.unit_of_measurement || this.getConfiguredTemperatureUnit();
      if (temp !== undefined && !isNaN(temp)) {
        return this.toConfiguredTempWithoutUnit(unit, temp);
      }
    } 

    // return weather temperature if above code could not extract temperature from temperature_sensor
    return this.getWeather().attributes.temperature ?? null;
  }

  private getSun(): HassEntityBase | undefined {
    return this.hass.states[this.config.sun_entity];
  }

  private getLocale(): string {
    return this.config.locale || this.hass.locale?.language || 'en-GB';
  }

  private getDateFnsLocale(): Locale {
    const locale = this.getLocale();
    const localeParts = locale
      .replace('_', '-')
      .split('-');
    const localeOne = localeParts[0].toLowerCase();
    const localeTwo = localeParts[1]?.toUpperCase() || '';
    const dateFnsLocale = localeOne + localeTwo;
    // HA provides en-US as en
    if (dateFnsLocale === 'en') {
      return locales.enUS;
    }
    const importedLocale = locales[dateFnsLocale];
    if (!importedLocale) {
      console.error('clock-weather-card - Locale not supported: ' + dateFnsLocale);
      return locales.enGB;
    }
    return importedLocale;
  }

  private date(): string {
    const zonedDate = this.toZonedDate(this.currentDate);
    const weekday = this.localize(`day.${zonedDate.getDay()}`);
    const date = format(zonedDate, this.config.date_pattern, { locale: this.getDateFnsLocale() });
    return`${weekday}, ${date}`
  }

  private time(date: Date = this.currentDate): string {
    const withTimeZone = this.toZonedDate(date);
    return format(withTimeZone, this.getTimeFormat() === '24' ? 'HH:mm' : 'h:mm aa');
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

  private toConfiguredTempWithUnit(unit: TemperatureUnit, temp: number): string {
    const convertedTemp = this.toConfiguredTempWithoutUnit(unit, temp);
    return convertedTemp + this.getConfiguredTemperatureUnit();
  }

  private toConfiguredTempWithoutUnit(unit: TemperatureUnit, temp: number): number {
    const configuredUnit = this.getConfiguredTemperatureUnit();
    if (configuredUnit === unit) {
      return temp;
    }

    return unit === '°C'
      ? this.toFahrenheit(unit, temp)
      : this.toCelsius(unit, temp);

  }

  private getTimeFormat(): '12' | '24' {
    if (this.config.time_format) {
      return this.config.time_format;
    }

    if (this.hass.locale?.time_format === TimeFormat.twenty_four) return '24';
    if (this.hass.locale?.time_format === TimeFormat.am_pm) return '12';
    return '24';
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
      return localize(key, this.getLocale());
  }

  private extractForecasts(forecasts: WeatherForecast[], items: number, hourly: boolean): MergedWeatherForecast[] {
    const agg = forecasts.reduce((forecasts, forecast) => {
      const d = new Date(forecast.datetime);
      const unit = !hourly ? d.getDate() : d.getDate()+"_"+d.getHours();
      forecasts[unit] = forecasts[unit] || [];
      forecasts[unit].push(forecast);
      return forecasts;
    }, {} as Record<number, WeatherForecast[]>);

    return Object.values(agg)
      .reduce((agg: MergedWeatherForecast[], forecasts) => {
        if (!forecasts.length) return agg;
        const avg = this.calculateAverageForecast(forecasts);
        agg.push(avg);
        return agg;
      }, [])
      .sort((a,b) => a.datetime.getTime() - b.datetime.getTime())
      .slice(0, items);
  }

  private toZonedDate(date: Date): Date {
    if (this.config.use_browser_time) return date;
    const timeZone = this.hass?.config?.time_zone
    const withTimeZone = DateTime.fromJSDate(date).setZone(timeZone);
    if (!withTimeZone.isValid) {
      console.error(`clock-weather-card - Time Zone [${timeZone}] not supported. Falling back to browser time.`);
      return date;
    }
    return new Date(withTimeZone.year, withTimeZone.month - 1, withTimeZone.day, withTimeZone.hour, withTimeZone.minute, withTimeZone.second, withTimeZone.millisecond);
  }

  private calculateAverageForecast(forecasts: WeatherForecast[]): MergedWeatherForecast {
    const minTemps = forecasts.map((f) => f.templow ?? f.temperature ?? this.getCurrentTemperature() ?? 0);
    const minTemp = min(minTemps);

    const maxTemps = forecasts.map((f) => f.temperature ?? this.getCurrentTemperature() ?? 0);
    const maxTemp = max(maxTemps);

    const precipitationProbabilities = forecasts.map((f) => f.precipitation_probability ?? 0);
    const precipitationProbability = max(precipitationProbabilities);

    const precipitations = forecasts.map((f) => f.precipitation ?? 0);
    const precipitation = max(precipitations);

    const conditions = forecasts.map((f) => f.condition);
    const condition = extractMostOccuring(conditions);

    return {
      temperature: maxTemp,
      templow: minTemp,
      datetime: new Date(forecasts[0].datetime),
      condition: condition,
      precipitation_probability: precipitationProbability,
      precipitation: precipitation,
    }
  }
}

