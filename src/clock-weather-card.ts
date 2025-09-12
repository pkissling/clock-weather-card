import { HomeAssistant } from 'custom-card-helpers'
import { html, LitElement, nothing, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import iconsService from '@/service/icons-service'
import logger from '@/service/logger'
import translationsService from '@/service/translations-service'
import { ClockWeatherCardConfig, Weather, WeatherForecast, WeatherForecastEvent } from '@/types'
import { customElementName, isDev } from '@/utils/development'

// eslint-disable-next-line no-restricted-imports
import { version } from '../package.json'

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
  @state() private forecasts?: WeatherForecast[]
  private forecastSubscription: (() => Promise<void>) | null = null

  protected render (): TemplateResult {
    if (!this.hass || !this.config) {
      // TODO
      return html`<ha-card><h1>Loading...</h1></ha-card>`
    }
    const weather = this.getWeather()
    const type = this.config.weather_icon_type ?? 'line'
    const animated = this.config.animated_icon ?? true
    const iconUrl = iconsService.getWeatherIcon(type, animated, weather.state, this.isNight())
    return html`
      <ha-card>
        ${this.config.title ? html`<h1>${this.config.title}</h1>` : nothing}
        <p>Current Weather: ${weather.state}</p>
        <p>Misc: ${translationsService.t('de', 'weather.pouring')}</p>
        <ul>
          ${this.forecasts?.map((forecast) => html`
          <li>
            ${forecast.datetime}: ${forecast.condition}, ${forecast.temperature}${this.hass.config.unit_system.temperature}
          </li>`)}
        </ul>
        <img src="${iconUrl}" alt="weather icon">
      </ha-card>
    `
  }

  public setConfig(config: ClockWeatherCardConfig): void {
    // TODO null check?
    this.config = config
  }

  private isNight(): boolean {
    const sunEntityId = this.config.sun_entity || 'sun.sun'
    const sun = this.hass.states[sunEntityId]
    return sun?.state === 'below_horizon'
  }

  public static getStubConfig (_: HomeAssistant, entities: string[], entitiesFallback: string[]): Omit<ClockWeatherCardConfig, 'type'> {
    const entity = entities.find(e => e.startsWith('weather.') ?? entitiesFallback.find(() => true))
    return { entity }
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

  public static getConfigForm(): Object {
    return {
      schema: [
        { name: 'entity', required: true, selector: { entity: {} } },
        { name: 'title', selector: { text: {} } },
      ],
      computeLabel: (schema: { name?: string }) => {
        if (!schema.name) return ''
        // TODO locale
        return translationsService.t('en-GB', `config-editor.${schema.name}`)
      },
      assertConfig: (_: ClockWeatherCard) => {
        // TODO
      },
    }
  }
}
