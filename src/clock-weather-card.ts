import { html, LitElement, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'

import translationsService from '@/service/translations-service'
import { generateCustomElementName, isDev } from '@/utils/development'

// eslint-disable-next-line no-restricted-imports
import { version } from '../package.json'
import { HomeAssistant } from 'custom-card-helpers'
import { ClockWeatherCardConfig, Weather } from './types'

const customElementName = generateCustomElementName()

// This puts your card into the UI card picker dialog
window.customCards = window.customCards || []
window.customCards.push({
  type: customElementName,
  name: 'Clock Weather Card',
  description: 'Shows the current date/time in combination with the current weather and an iOS insipired weather forecast.',
  preview: true,
  documentationURL: 'https://github.com/pkissling/clock-weather-card'
})

// eslint-disable-next-line no-console
console.info(
  `%c  CLOCK-WEATHER-CARD \n%c Version: ${isDev ? 'DEV' : version}`,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);

// This puts your card into the UI card picker dialog
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'clock-weather-card',
  name: 'Clock Weather Card',
  description: 'Shows the current date/time in combination with the current weather and an iOS insipired weather forecast.'
})

const gradientMap: Map<number, Rgb> = new Map()
  .set(-20, new Rgb(0, 60, 98)) // dark blue
  .set(-10, new Rgb(120, 162, 204)) // darker blue
  .set(0, new Rgb(164, 195, 210)) // light blue
  .set(10, new Rgb(121, 210, 179)) // turquoise
  .set(20, new Rgb(252, 245, 112)) // yellow
  .set(30, new Rgb(255, 150, 79)) // orange
  .set(40, new Rgb(255, 192, 159)) // red

@customElement('clock-weather-card')
export class ClockWeatherCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @state() private config!: ClockWeatherCardConfig

  protected render (): TemplateResult {
    if (this.error) {
      return this.error
    }

    const showToday = !this.config.hide_today_section
    const showForecast = !this.config.hide_forecast_section
    return html`
      <ha-card
        @action=${(e: ActionHandlerEvent) => { this.handleAction(e) }}
        .actionHandler=${actionHandler({
      hasHold: hasAction(this.config.hold_action as ActionConfig | undefined),
      hasDoubleClick: hasAction(this.config.double_tap_action as ActionConfig | undefined)
    })}
        tabindex="0"
        .label=${`Clock Weather Card: ${this.config.entity || 'No Entity Defined'}`}
      >
        ${this.config.title
        ? html`
          <div class="card-header">
            ${this.config.title}
          </div>`
        : ''}
        <div class="card-content">
          ${showToday
        ? html`
            <clock-weather-card-today>
              ${safeRender(() => this.renderToday())}
            </clock-weather-card-today>`
        : ''}
          ${showForecast
        ? html`
            <clock-weather-card-forecast>
              ${safeRender(() => this.renderForecast())}
            </clock-weather-card-forecast>`
        : ''}
        </div>
      </ha-card>
    `
  }

  public connectedCallback (): void {
    super.connectedCallback()
    if (this.hasUpdated) {
      void this.subscribeForecastEvents()
    }
  }

  public disconnectedCallback (): void {
    super.disconnectedCallback()
    void this.unsubscribeForecastEvents()
  }

  protected willUpdate (changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    if (!this.forecastSubscriber) {
      void this.subscribeForecastEvents()
    }
  }

  private renderToday (): TemplateResult {
    const weather = this.getWeather()
    const state = weather.state
    const temp = this.config.show_decimal ? this.getCurrentTemperature() : roundIfNotNull(this.getCurrentTemperature())
    const tempUnit = weather.attributes.temperature_unit
    const apparentTemp = this.config.show_decimal ? this.getApparentTemperature() : roundIfNotNull(this.getApparentTemperature())
    const aqi = this.getAqi()
    const aqiColor = this.getAqiColor(aqi)
    const humidity = roundIfNotNull(this.getCurrentHumidity())
    const iconType = this.config.weather_icon_type
    const icon = this.toIcon(state, iconType, false, this.getIconAnimationKind())
    const weatherString = this.localize(`weather.${state}`)
    const localizedTemp = temp !== null ? this.toConfiguredTempWithUnit(tempUnit, temp) : null
    const localizedHumidity = humidity !== null ? `${humidity}% ${this.localize('misc.humidity')}` : null
    const localizedApparent = apparentTemp !== null ? this.toConfiguredTempWithUnit(tempUnit, apparentTemp) : null
    const apparentString = this.localize('misc.feels-like')
    const aqiString = this.localize('misc.aqi')

    return html`
      <clock-weather-card-today-left>
        <img class="grow-img" src=${icon} />
      </clock-weather-card-today-left>
      <clock-weather-card-today-right>
        <clock-weather-card-today-right-wrap>
          <clock-weather-card-today-right-wrap-top>
            ${this.config.hide_clock ? weatherString : localizedTemp ? `${weatherString}, ${localizedTemp}` : weatherString}
            ${this.config.show_humidity && localizedHumidity ? html`<br>${localizedHumidity}` : ''}
            ${this.config.apparent_sensor && apparentTemp ? html`<br>${apparentString}: ${localizedApparent}` : ''}
            ${this.config.aqi_sensor && aqi !== null ? html`<br><aqi style="background-color: ${aqiColor}">${aqi} ${aqiString}</aqi>` : ''}
          </clock-weather-card-today-right-wrap-top>
          <clock-weather-card-today-right-wrap-center>
            ${this.config.hide_clock ? localizedTemp ?? 'n/a' : this.time()}
          </clock-weather-card-today-right-wrap-center>
          <clock-weather-card-today-right-wrap-bottom>
            ${this.config.hide_date ? '' : this.date()}
          </clock-weather-card-today-right-wrap-bottom>
        </clock-weather-card-today-right-wrap>
      </clock-weather-card-today-right>`
  }

  private renderForecast (): TemplateResult[] {
    const weather = this.getWeather()
    const currentTemp = roundIfNotNull(this.getCurrentTemperature())
    const maxRowsCount = this.config.forecast_rows
    const hourly = this.config.hourly_forecast
    const temperatureUnit = weather.attributes.temperature_unit

    const forecasts = this.mergeForecasts(maxRowsCount, hourly)

    const minTemps = forecasts.map((f) => f.templow)
    const maxTemps = forecasts.map((f) => f.temperature)
    if (currentTemp !== null) {
      minTemps.push(currentTemp)
      maxTemps.push(currentTemp)
    }
    const minTemp = Math.round(min(minTemps))
    const maxTemp = Math.round(max(maxTemps))

    const gradientRange = this.gradientRange(minTemp, maxTemp, temperatureUnit)

    const displayTexts = forecasts
      .map(f => f.datetime)
      .map(d => hourly ? this.time(d) : this.localize(`day.${d.weekday}`))
    const maxColOneChars = displayTexts.length ? max(displayTexts.map(t => t.length)) : 0

    return forecasts.map((forecast, i) => safeRender(() => this.renderForecastItem(forecast, gradientRange, minTemp, maxTemp, currentTemp, hourly, displayTexts[i], maxColOneChars)))
  }

  private renderForecastItem (forecast: MergedWeatherForecast, gradientRange: Rgb[], minTemp: number, maxTemp: number, currentTemp: number | null, hourly: boolean, displayText: string, maxColOneChars: number): TemplateResult {
    const weatherState = forecast.condition === 'pouring' ? 'raindrops' : forecast.condition === 'rainy' ? 'raindrop' : forecast.condition
    const weatherIcon = this.toIcon(weatherState, 'fill', true, 'static')
    const tempUnit = this.getWeather().attributes.temperature_unit
    const isNow = hourly ? DateTime.now().hour === forecast.datetime.hour : DateTime.now().day === forecast.datetime.day
    const minTempDay = Math.round(isNow && currentTemp !== null ? Math.min(currentTemp, forecast.templow) : forecast.templow)
    const maxTempDay = Math.round(isNow && currentTemp !== null ? Math.max(currentTemp, forecast.temperature) : forecast.temperature)

    return html`
      <div>
        <h1>Hello World</h1>
      </div>
    `
  }

  public setConfig(_: unknown): void {
  }
}
