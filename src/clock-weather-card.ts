import { HomeAssistant } from 'custom-card-helpers'
import { html, LitElement, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import animatedFillFogNight from '@/icons/fill/svg/fog-night.svg'
import logger from '@/service/logger'
import translationsService from '@/service/translations-service'
import { ClockWeatherCardConfig, Weather, WeatherForecast, WeatherForecastEvent } from '@/types'
import { generateCustomElementName, isDev } from '@/utils/development'

// eslint-disable-next-line no-restricted-imports
import { version } from '../package.json'

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
)

@customElement(customElementName)
export class ClockWeatherCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @state() private config!: ClockWeatherCardConfig
  @state() private misc: string | null = null
  @state() private forecasts?: WeatherForecast[]
  private forecastSubscription: (() => Promise<void>) | null = null

  protected render (): TemplateResult {
    if (!this.hass || !this.config) {
      // TODO
      return html`<ha-card><h1>Loading...</h1></ha-card>`
    }
    return html`
      <ha-card>
        <h1>Hello World</h1>
        <p>Current Weather: ${this.getWeather().state}</p>
        <p>Misc: ${this.misc}</p>
        <ul>
          ${this.forecasts?.map((forecast) => html`
            <li>
              ${forecast.datetime}: ${forecast.condition}, ${forecast.temperature}${this.hass.config.unit_system.temperature}
            </li>`)}
        </ul>
        <img src="${animatedFillFogNight}">

      </ha-card>
    `
  }

  public setConfig(config: ClockWeatherCardConfig): void {
    // TODO null check?
    this.config = config
  }

  private getWeather (): Weather {
    const weather = this.hass.states[this.config.entity] as Weather | undefined
    if (!weather) {
      throw new Error(`Entity ${this.config.entity} not found`)
    }
    return weather
  }

  public connectedCallback(): void {
    super.connectedCallback()
    this.trySubscribeToForecastEvents()
    translationsService.fetchTranslation('ar', 'weather.pouring')
      .then((translation) => {
        this.misc = translation
      })
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    this.tryUnsubscribeForecastEvents()
  }

  protected updated(): void {
    this.trySubscribeToForecastEvents()
  }

  private async trySubscribeToForecastEvents(): Promise<void> {
    if (this.forecastSubscription || !this.hass || !this.config) return

    try {
      const callback = (event: WeatherForecastEvent): void => {
        this.forecasts = event.forecast
      }
      const options = { resubscribe: false }
      const message = {
        type: 'weather/subscribe_forecast',
        forecast_type: 'daily', // TODO
        entity_id: this.config.entity
      }
      this.forecastSubscription = await this.hass.connection.subscribeMessage<WeatherForecastEvent>(callback, message, options)
      logger.debug('Subscribed to weather forecast')
    } catch (e: unknown) {
      logger.error('Error subscribing to weather forecast', e)
    }
  }

  private async tryUnsubscribeForecastEvents (): Promise<void> {
    if (this.forecastSubscription) {
      try {
        await this.forecastSubscription()
        logger.debug('Unsubscribed from weather forecast')
      } catch (e: unknown) {
        // swallow error, as this means that connection was closed already
      } finally {
        this.forecastSubscription = null
      }
    }
  }
}
