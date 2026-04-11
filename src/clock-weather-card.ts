import '@/components/clock-weather-card-today'

import type { HomeAssistant } from 'custom-card-helpers'
import type { CSSResultGroup } from 'lit'
import { html, LitElement, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import configService from '@/service/config-service'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import translationsService from '@/service/translations-service'
import styles from '@/styles'
import type { ClockWeatherCardConfig, MergedClockWeatherCardConfig, WeatherForecastEvent } from '@/types'
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
  @state() private config!: MergedClockWeatherCardConfig
  private forecastSubscription: (() => Promise<void>) | null = null

  protected render (): TemplateResult {
    if (!this.hass || !this.config) {
      // TODO
      return html`<ha-card><h1>Loading...</h1></ha-card>`
    }

    const weatherState = hassService.getWeatherState(this.hass.states, this.config.entity)
    const isNight = hassService.isNight(this.hass.states, this.config.sun_entity)
    const weatherIconType = this.config.weather_icon_type
    const animatedIcon = this.config.animated_icon

    return html`
      <ha-card>
        <h1 class="card-header">${this.config.title}</h1>
        <div class="card-content">
          <clock-weather-card-today
            .weatherState=${weatherState}
            .isNight=${isNight}
            .animatedIcon=${animatedIcon}
            .weatherIconType=${weatherIconType}
          ></clock-weather-card-today>
        </div>
      </ha-card>
      `
  }

  public setConfig(config: ClockWeatherCardConfig): void {
    // TODO null check?
    // TODO validation
    this.config = configService.mergeWithDefaultConfig(config)
  }

  public static getStubConfig (_: HomeAssistant, entities: string[], entitiesFallback: string[]): Omit<ClockWeatherCardConfig, 'type'> {
    const entity = entities.find(e => e.startsWith('weather.') ?? entitiesFallback.find(() => true))
    return { entity }
  }

  public connectedCallback(): void {
    super.connectedCallback()
    this.trySubscribeToForecastEvents()
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    this.tryUnsubscribeForecastEvents()
  }

  public updated(): void {
    this.trySubscribeToForecastEvents()
  }

  private async trySubscribeToForecastEvents(): Promise<void> {
    if (this.forecastSubscription || !this.hass || !this.config) return

    try {
      const callback = (_: WeatherForecastEvent): void => {
        // this.forecasts = event.forecast
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
      } catch (_: unknown) {
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

  public static get styles (): CSSResultGroup {
    return styles
  }
}
