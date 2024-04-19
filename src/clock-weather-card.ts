import { LitElement, html, type TemplateResult, type PropertyValues, type CSSResultGroup } from 'lit'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators.js'
import {
  type HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  type ActionHandlerEvent,
  handleAction,
  TimeFormat,
  type ActionConfig
} from 'custom-card-helpers' // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import {
  type ClockWeatherCardConfig,
  type MergedClockWeatherCardConfig,
  type MergedWeatherForecast,
  Rgb,
  type TemperatureSensor,
  type TemperatureUnit,
  type HumiditySensor,
  type Weather,
  WeatherEntityFeature,
  type WeatherForecast,
  type WeatherForecastEvent
} from './types'
import styles from './styles'
import { actionHandler } from './action-handler-directive'
import { localize } from './localize/localize'
import { type HassEntityBase } from 'home-assistant-js-websocket'
import { extractMostOccuring, max, min, round, roundDown, roundIfNotNull, roundUp } from './utils'
import { animatedIcons, staticIcons } from './images'
import { version } from '../package.json'
import { safeRender } from './helpers'
import { DateTime } from 'luxon'

console.info(
  `%c  CLOCK-WEATHER-CARD \n%c Version: ${version}`,
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
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant

  @state() private config!: MergedClockWeatherCardConfig
  @state() private currentDate!: DateTime
  @state() private forecasts?: WeatherForecast[]
  @state() private error?: TemplateResult
  private forecastSubscriber?: () => Promise<void>
  private forecastSubscriberLock = false

  constructor () {
    super()
    this.currentDate = DateTime.now()
    const msToNextSecond = (1000 - this.currentDate.millisecond)
    setTimeout(() => setInterval(() => { this.currentDate = DateTime.now() }, 1000), msToNextSecond)
    setTimeout(() => { this.currentDate = DateTime.now() }, msToNextSecond)
  }

  public static getStubConfig (_hass: HomeAssistant, entities: string[], entitiesFallback: string[]): Record<string, unknown> {
    const entity = entities.find(e => e.startsWith('weather.') ?? entitiesFallback.find(() => true))
    if (entity) {
      return { entity }
    }

    return {}
  }

  public getCardSize (): number {
    return 3 + roundUp(this.config.forecast_rows / 2)
  }

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig (config?: ClockWeatherCardConfig): void {
    if (!config) {
      throw this.createError('Invalid configuration.')
    }

    if (!config.entity) {
      throw this.createError('Attribute "entity" must be present.')
    }

    if (config.forecast_rows && config.forecast_rows < 1) {
      throw this.createError('Attribute "forecast_rows" must be greater than 0.')
    }

    if (config.time_format && config.time_format.toString() !== '24' && config.time_format.toString() !== '12') {
      throw this.createError('Attribute "time_format" must either be "12" or "24".')
    }

    if (config.hide_today_section && config.hide_forecast_section) {
      throw this.createError('Attributes "hide_today_section" and "hide_forecast_section" must not enabled at the same time.')
    }

    this.config = this.mergeConfig(config)
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate (changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false
    }

    if (changedProps.has('forecasts')) {
      return true
    }

    const oldHass = changedProps.get('hass') as HomeAssistant | undefined
    if (oldHass) {
      const oldSun = oldHass.states[this.config.sun_entity]
      const newSun = this.hass.states[this.config.sun_entity]
      if (oldSun !== newSun) {
        return true
      }
    }

    return hasConfigOrEntityChanged(this, changedProps, false)
  }

  protected updated (changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (changedProps.has('config')) {
      void this.subscribeForecastEvents()
    }
  }

  // https://lit.dev/docs/components/rendering/
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
    const humidity = roundIfNotNull(this.getCurrentHumidity())
    const iconType = this.config.weather_icon_type
    const icon = this.toIcon(state, iconType, false, this.getIconAnimationKind())
    const weatherString = this.localize(`weather.${state}`)
    const localizedTemp = temp !== null ? this.toConfiguredTempWithUnit(tempUnit, temp) : null
    const localizedHumidity = humidity !== null ? `${humidity}% ${this.localize('misc.humidity')}` : null
    const localizedApparent = apparentTemp !== null ? this.toConfiguredTempWithUnit(tempUnit, apparentTemp) : null
    const apparentString = this.localize('misc.feels-like')

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
      <clock-weather-card-forecast-row style="--col-one-size: ${(maxColOneChars * 0.5)}rem;">
        ${this.renderText(displayText)}
        ${this.renderIcon(weatherIcon)}
        ${this.renderText(this.toConfiguredTempWithUnit(tempUnit, minTempDay), 'right')}
        ${this.renderForecastTemperatureBar(gradientRange, minTemp, maxTemp, minTempDay, maxTempDay, isNow, currentTemp)}
        ${this.renderText(this.toConfiguredTempWithUnit(tempUnit, maxTempDay))}
      </clock-weather-card-forecast-row>
    `
  }

  private renderText (text: string, textAlign: 'left' | 'center' | 'right' = 'left'): TemplateResult {
    return html`
      <forecast-text style="--text-align: ${textAlign};">
        ${text}
      </forecast-text>
    `
  }

  private renderIcon (src: string): TemplateResult {
    return html`
      <forecast-icon>
        <img class="grow-img" src=${src} />
      </forecast-icon>
    `
  }

  private renderForecastTemperatureBar (gradientRange: Rgb[], minTemp: number, maxTemp: number, minTempDay: number, maxTempDay: number, isNow: boolean, currentTemp: number | null): TemplateResult {
    const { startPercent, endPercent } = this.calculateBarRangePercents(minTemp, maxTemp, minTempDay, maxTempDay)
    const moveRight = maxTemp === minTemp ? 0 : (minTempDay - minTemp) / (maxTemp - minTemp)
    return html`
      <forecast-temperature-bar>
        <forecast-temperature-bar-background> </forecast-temperature-bar-background>
        <forecast-temperature-bar-range
          style="--move-right: ${moveRight}; --start-percent: ${startPercent}%; --end-percent: ${endPercent}%; --gradient: ${this.gradient(
            gradientRange,
            startPercent,
            endPercent
          )};"
        >
          ${isNow ? this.renderForecastCurrentTemp(minTempDay, maxTempDay, currentTemp) : ''}
        </forecast-temperature-bar-range>
      </forecast-temperature-bar>
    `
  }

  private renderForecastCurrentTemp (minTempDay: number, maxTempDay: number, currentTemp: number | null): TemplateResult {
    if (currentTemp == null) {
      return html``
    }
    const indicatorPosition = minTempDay === maxTempDay ? 0 : (100 / (maxTempDay - minTempDay)) * (currentTemp - minTempDay)
    const steps = maxTempDay - minTempDay
    const moveRight = maxTempDay === minTempDay ? 0 : (currentTemp - minTempDay) / steps
    return html`
      <forecast-temperature-bar-current-indicator style="--position: ${indicatorPosition}%;">
        <forecast-temperature-bar-current-indicator-dot style="--move-right: ${moveRight}">
        </forecast-temperature-bar-current-indicator-dot>
      </forecast-temperature-bar-current-indicator>
    `
  }

  // https://lit.dev/docs/components/styles/
  static get styles (): CSSResultGroup {
    return styles
  }

  private gradientRange (minTemp: number, maxTemp: number, temperatureUnit: TemperatureUnit): Rgb[] {
    const minTempCelsius = this.toCelsius(temperatureUnit, minTemp)
    const maxTempCelsius = this.toCelsius(temperatureUnit, maxTemp)
    const minVal = Math.max(roundDown(minTempCelsius, 10), min([...gradientMap.keys()]))
    const maxVal = Math.min(roundUp(maxTempCelsius, 10), max([...gradientMap.keys()]))
    return Array.from(gradientMap.keys())
      .filter((temp) => temp >= minVal && temp <= maxVal)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map((temp) => gradientMap.get(temp)!)
  }

  private gradient (rgbs: Rgb[], fromPercent: number, toPercent: number): string {
    if (rgbs.length <= 1) {
      const rgb = rgbs[0] ?? new Rgb(255, 255, 255)
      return [rgb, rgb]
        .map((rgb) => rgb.toRgbString())
        .join(',')
    }
    const [fromRgb, fromIndex] = this.calculateRgb(rgbs, fromPercent, 'left')
    const [toRgb, toIndex] = this.calculateRgb(rgbs, toPercent, 'right')
    const between = rgbs.slice(fromIndex + 1, toIndex)

    return [fromRgb, ...between, toRgb]
      .map((rgb) => rgb.toRgbString())
      .join(',')
  }

  private calculateRgb (rgbs: Rgb[], percent: number, pickIndex: 'left' | 'right'): [rgb: Rgb, index: number] {
    function valueAtPosition (start: number, end: number, percent: number): number {
      const abs = Math.abs(start - end)
      const value = (abs / 100) * percent
      if (start > end) {
        return round(start - value)
      } else {
        return round(start + value)
      }
    }

    function rgbAtPosition (startIndex: number, endIndex: number, percentToNextIndex: number, rgbs: Rgb[]): Rgb {
      const start = rgbs[startIndex]
      const end = rgbs[endIndex]
      const percent = percentToNextIndex < 0 ? 100 + percentToNextIndex : percentToNextIndex
      const left = percentToNextIndex < 0 ? end : start
      const right = percentToNextIndex < 0 ? start : end
      const r = valueAtPosition(left.r, right.r, percent)
      const g = valueAtPosition(left.g, right.g, percent)
      const b = valueAtPosition(left.b, right.b, percent)
      return new Rgb(r, g, b)
    }

    const steps = 100 / (rgbs.length - 1)
    const step = percent / steps
    const startIndex = Math.round(step)
    const percentToNextIndex = (100 / steps) * (percent - startIndex * steps)
    const endIndex = percentToNextIndex === 0 ? startIndex : percentToNextIndex < 0 ? startIndex - 1 : startIndex + 1
    const rgb = rgbAtPosition(startIndex, endIndex, percentToNextIndex, rgbs)
    const index = pickIndex === 'left' ? Math.min(startIndex, endIndex) : Math.max(startIndex, endIndex)
    return [rgb, index]
  }

  private handleAction (ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action)
    }
  }

  private mergeConfig (config: ClockWeatherCardConfig): MergedClockWeatherCardConfig {
    return {
      ...config,
      sun_entity: config.sun_entity ?? 'sun.sun',
      temperature_sensor: config.temperature_sensor,
      humidity_sensor: config.humidity_sensor,
      weather_icon_type: config.weather_icon_type ?? 'line',
      forecast_rows: config.forecast_rows ?? 5,
      hourly_forecast: config.hourly_forecast ?? false,
      animated_icon: config.animated_icon ?? true,
      time_format: config.time_format?.toString() as '12' | '24' | undefined,
      time_pattern: config.time_pattern ?? undefined,
      show_humidity: config.show_humidity ?? false,
      hide_forecast_section: config.hide_forecast_section ?? false,
      hide_today_section: config.hide_today_section ?? false,
      hide_clock: config.hide_clock ?? false,
      hide_date: config.hide_date ?? false,
      date_pattern: config.date_pattern ?? 'D',
      use_browser_time: config.use_browser_time ?? false,
      time_zone: config.time_zone ?? undefined,
      show_decimal: config.show_decimal ?? false,
      apparent_sensor: config.apparent_sensor ?? undefined
    }
  }

  private toIcon (weatherState: string, type: 'fill' | 'line', forceDay: boolean, kind: 'static' | 'animated'): string {
    const daytime = forceDay ? 'day' : this.getSun()?.state === 'below_horizon' ? 'night' : 'day'
    const iconMap = kind === 'animated' ? animatedIcons : staticIcons
    const icon = iconMap[type][weatherState]
    return icon?.[daytime] || icon
  }

  private getWeather (): Weather {
    const weather = this.hass.states[this.config.entity] as Weather | undefined
    if (!weather) {
      throw this.createError(`Weather entity "${this.config.entity}" could not be found.`)
    }
    return weather
  }

  private getCurrentTemperature (): number | null {
    if (this.config.temperature_sensor) {
      const temperatureSensor = this.hass.states[this.config.temperature_sensor] as TemperatureSensor | undefined
      const temp = temperatureSensor?.state ? parseFloat(temperatureSensor.state) : undefined
      const unit = temperatureSensor?.attributes.unit_of_measurement ?? this.getConfiguredTemperatureUnit()
      if (temp !== undefined && !isNaN(temp)) {
        return this.toConfiguredTempWithoutUnit(unit, temp)
      }
    }

    // return weather temperature if above code could not extract temperature from temperature_sensor
    return this.getWeather().attributes.temperature ?? null
  }

  private getCurrentHumidity (): number | null {
    if (this.config.humidity_sensor) {
      const humiditySensor = this.hass.states[this.config.humidity_sensor] as HumiditySensor | undefined
      const humid = humiditySensor?.state ? parseFloat(humiditySensor.state) : undefined
      if (humid !== undefined && !isNaN(humid)) {
        return humid
      }
    }

    // Return weather humidity if the code could not extract humidity from the humidity_sensor
    return this.getWeather().attributes.humidity ?? null
  }

  private getApparentTemperature (): number | null {
    if (this.config.apparent_sensor) {
      const apparentSensor = this.hass.states[this.config.apparent_sensor] as TemperatureSensor | undefined
      const temp = apparentSensor?.state ? parseFloat(apparentSensor.state) : undefined
      const unit = apparentSensor?.attributes.unit_of_measurement ?? this.getConfiguredTemperatureUnit()
      if (temp !== undefined && !isNaN(temp)) {
        return this.toConfiguredTempWithoutUnit(unit, temp)
      }
    }
    return null
  }

  private getSun (): HassEntityBase | undefined {
    return this.hass.states[this.config.sun_entity]
  }

  private getLocale (): string {
    return this.config.locale ?? this.hass.locale.language ?? 'en-GB'
  }

  private date (): string {
    return this.toZonedDate(this.currentDate).toFormat(this.config.date_pattern)
  }

  private time (date: DateTime = this.currentDate): string {
    if (this.config.time_pattern) {
      return this.toZonedDate(date).toFormat(this.config.time_pattern)
    }

    if (this.config.time_format) {
      return this.toZonedDate(date)
        .toFormat(this.config.time_format === '24' ? 'HH:mm' : 'h:mm a')
    }
    if (this.hass.locale.time_format === TimeFormat.am_pm) {
      return this.toZonedDate(date).toFormat('h:mm a')
    }

    if (this.hass.locale.time_format === TimeFormat.twenty_four) {
      return this.toZonedDate(date).toFormat('HH:mm')
    }

    return this.toZonedDate(date).toFormat('t')
  }

  private getIconAnimationKind (): 'static' | 'animated' {
    return this.config.animated_icon ? 'animated' : 'static'
  }

  private toCelsius (temperatueUnit: TemperatureUnit, temperature: number): number {
    return temperatueUnit === '°C' ? temperature : Math.round((temperature - 32) * (5 / 9))
  }

  private toFahrenheit (temperatueUnit: TemperatureUnit, temperature: number): number {
    return temperatueUnit === '°F' ? temperature : Math.round((temperature * 9 / 5) + 32)
  }

  private getConfiguredTemperatureUnit (): TemperatureUnit {
    return this.hass.config.unit_system.temperature as TemperatureUnit
  }

  private toConfiguredTempWithUnit (unit: TemperatureUnit, temp: number): string {
    const convertedTemp = this.toConfiguredTempWithoutUnit(unit, temp)
    return convertedTemp + this.getConfiguredTemperatureUnit()
  }

  private toConfiguredTempWithoutUnit (unit: TemperatureUnit, temp: number): number {
    const configuredUnit = this.getConfiguredTemperatureUnit()
    if (configuredUnit === unit) {
      return temp
    }

    return unit === '°C'
      ? this.toFahrenheit(unit, temp)
      : this.toCelsius(unit, temp)
  }

  private calculateBarRangePercents (minTemp: number, maxTemp: number, minTempDay: number, maxTempDay: number): { startPercent: number, endPercent: number } {
    if (maxTemp === minTemp) {
      // avoid division by 0
      return { startPercent: 0, endPercent: 100 }
    }
    const startPercent = (100 / (maxTemp - minTemp)) * (minTempDay - minTemp)
    const endPercent = (100 / (maxTemp - minTemp)) * (maxTempDay - minTemp)
    // fix floating point issue
    // (100 / (19 - 8)) * (19 - 8) = 100.00000000000001
    return {
      startPercent: Math.max(0, startPercent),
      endPercent: Math.min(100, endPercent)
    }
  }

  private localize (key: string): string {
    return localize(key, this.getLocale())
  }

  private mergeForecasts (maxRowsCount: number, hourly: boolean): MergedWeatherForecast[] {
    const forecasts = this.isLegacyWeather() ? this.getWeather().attributes.forecast ?? [] : this.forecasts ?? []
    const agg = forecasts.reduce<Record<number, WeatherForecast[]>>((forecasts, forecast) => {
      const d = new Date(forecast.datetime)
      const unit = hourly ? `${d.getMonth()}-${d.getDate()}-${+d.getHours()}` : d.getDate()
      forecasts[unit] = forecasts[unit] || []
      forecasts[unit].push(forecast)
      return forecasts
    }, {})

    return Object.values(agg)
      .reduce((agg: MergedWeatherForecast[], forecasts) => {
        if (forecasts.length === 0) return agg
        const avg = this.calculateAverageForecast(forecasts)
        agg.push(avg)
        return agg
      }, [])
      .sort((a, b) => a.datetime.toMillis() - b.datetime.toMillis())
      .slice(0, maxRowsCount)
  }

  private toZonedDate (date: DateTime): DateTime {
    const localizedDate = date.setLocale(this.getLocale())
    if (this.config.use_browser_time) return localizedDate
    const timeZone = this.config.time_zone ?? this.hass?.config?.time_zone
    const withTimeZone = localizedDate.setZone(timeZone)
    if (withTimeZone.isValid) {
      return withTimeZone
    }
    console.error(`clock-weather-card - Time Zone [${timeZone}] not supported. Falling back to browser time.`)
    return localizedDate
  }

  private calculateAverageForecast (forecasts: WeatherForecast[]): MergedWeatherForecast {
    const minTemps = forecasts.map((f) => f.templow ?? f.temperature ?? this.getCurrentTemperature() ?? 0)
    const minTemp = min(minTemps)

    const maxTemps = forecasts.map((f) => f.temperature ?? this.getCurrentTemperature() ?? 0)
    const maxTemp = max(maxTemps)

    const precipitationProbabilities = forecasts.map((f) => f.precipitation_probability ?? 0)
    const precipitationProbability = max(precipitationProbabilities)

    const precipitations = forecasts.map((f) => f.precipitation ?? 0)
    const precipitation = max(precipitations)

    const conditions = forecasts.map((f) => f.condition)
    const condition = extractMostOccuring(conditions)

    return {
      temperature: maxTemp,
      templow: minTemp,
      datetime: this.parseDateTime(forecasts[0].datetime),
      condition,
      precipitation_probability: precipitationProbability,
      precipitation
    }
  }

  private async subscribeForecastEvents (): Promise<void> {
    if (this.forecastSubscriberLock) {
      return
    }
    this.forecastSubscriberLock = true
    await this.unsubscribeForecastEvents()
    if (this.isLegacyWeather()) {
      this.forecastSubscriber = async () => {}
      this.forecastSubscriberLock = false
      return
    }

    if (!this.isConnected || !this.config || !this.hass) {
      this.forecastSubscriberLock = false
      return
    }

    const forecastType = this.determineForecastType()
    if (forecastType === 'hourly_not_supported') {
      this.forecastSubscriber = async () => {}
      this.forecastSubscriberLock = false
      throw this.createError(`Weather entity [${this.config.entity}] does not support hourly forecast.`)
    }
    try {
      const callback = (event: WeatherForecastEvent): void => {
        this.forecasts = event.forecast
      }
      const options = { resubscribe: false }
      const message = {
        type: 'weather/subscribe_forecast',
        forecast_type: forecastType,
        entity_id: this.config.entity
      }
      this.forecastSubscriber = await this.hass.connection.subscribeMessage<WeatherForecastEvent>(callback, message, options)
    } catch (e: unknown) {
      console.error('clock-weather-card - Error when subscribing to weather forecast', e)
    } finally {
      this.forecastSubscriberLock = false
    }
  }

  private async unsubscribeForecastEvents (): Promise<void> {
    if (this.forecastSubscriber) {
      try {
        await this.forecastSubscriber()
      } catch (e: unknown) {
        // swallow error, as this means that connection was closed already
      } finally {
        this.forecastSubscriber = undefined
      }
    }
  }

  private isLegacyWeather (): boolean {
    return !this.supportsFeature(WeatherEntityFeature.FORECAST_DAILY) && !this.supportsFeature(WeatherEntityFeature.FORECAST_HOURLY)
  }

  private supportsFeature (feature: WeatherEntityFeature): boolean {
    try {
      return (this.getWeather().attributes.supported_features & feature) !== 0
    } catch (e) {
      // might be that weather entity was not found
      return false
    }
  }

  private createError (errorString: string): Error {
    const error = new Error(errorString)
    const errorCard = document.createElement('hui-error-card')
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config
    })
    this.error = html`${errorCard}`
    return error
  }

  private determineForecastType (): 'hourly' | 'daily' | 'hourly_not_supported' {
    const supportsDaily = this.supportsFeature(WeatherEntityFeature.FORECAST_DAILY)
    const supportsHourly = this.supportsFeature(WeatherEntityFeature.FORECAST_HOURLY)
    const hourly = this.config.hourly_forecast
    if (supportsDaily && supportsHourly) {
      return hourly ? 'hourly' : 'daily'
    } else if (hourly && supportsHourly) {
      return 'hourly'
    } else if (!hourly && supportsDaily) {
      return 'daily'
    } else if (hourly && !supportsHourly) {
      return 'hourly_not_supported'
    } else {
      // !hourly && !supportsDaily
      console.warn(`clock-weather-card - Weather entity [${this.config.entity}] does not support daily forecast. Falling back to hourly forecast.`)
      return 'hourly'
    }
  }

  private parseDateTime (date: string): DateTime {
    const fromIso = DateTime.fromISO(date)
    if (fromIso.isValid) {
      return fromIso
    }
    return DateTime.fromJSDate(new Date(date))
  }
}
