import '@/components/clock-weather-card-today'

import type { HomeAssistant } from 'custom-card-helpers'
import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import { LitElement } from 'lit'
import { html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import configService from '@/service/config-service'
import logger from '@/service/logger'
import translationsService from '@/service/translations-service'
import styles from '@/styles'
import type { ClockHandle, ClockWeatherCardConfig, WeatherForecastEvent } from '@/types'
import { computeNow, configNeedsSeconds, startClock } from '@/utils/clock'
import { isDev } from '@/utils/development'

// eslint-disable-next-line no-restricted-imports
import { version } from '../package.json'

// This puts your card into the UI card picker dialog
window.customCards = window.customCards || []
window.customCards.push({
  type: 'clock-weather-card',
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

@customElement('clock-weather-card')
export class ClockWeatherCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant
  @state() private config?: ClockWeatherCardConfig
  @state() private currentDate: DateTime = DateTime.now()
  private forecastSubscription: (() => Promise<void>) | null = null
  private _clock: ClockHandle | null = null

  protected render (): TemplateResult {
    if (!this.hass || !this.config) {
      // TODO
      return html`<ha-card><h1>Loading...</h1></ha-card>`
    }

    const title = configService.getTitle(this.config)
    return html`
      <ha-card>
        ${title ? html`<h1 class="card-header">${title}</h1>` : ''}
        <div class="card-content">
          <clock-weather-card-today
            .hass=${this.hass}
            .config=${this.config}
            .currentDate=${this.currentDate}
          ></clock-weather-card-today>
        </div>
      </ha-card>
      `
  }

  public setConfig(config: ClockWeatherCardConfig): void {
    // TODO null check?
    // TODO validation
    this.config = config
  }

  public static getStubConfig (_: HomeAssistant, entities: string[], entitiesFallback: string[]): Omit<ClockWeatherCardConfig, 'type'> {
    const entity = entities.find(e => e.startsWith('weather.') ?? entitiesFallback.find(() => true))
    return { entity }
  }

  public connectedCallback(): void {
    super.connectedCallback()
    this._tryStart()
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    this._stopClock()
    this.tryUnsubscribeForecastEvents()
  }

  public willUpdate(changed: PropertyValues): void {
    // Config change can affect tick interval (HH:mm vs HH:mm:ss) — restart.
    if (changed.has('config')) this._stopClock()
    this._tryStart()
  }

  // Idempotent — safe to call from any lifecycle hook.
  private _tryStart(): void {
    if (!this.hass || !this.config) return
    if (this._clock === null) {
      this._clock = startClock(configNeedsSeconds(this.config), () => {
        // hass/config are set when the clock starts and only cleared via
        // disconnectedCallback (which stops the clock first), so reading
        // them live keeps locale/timezone updates reactive.
        this.currentDate = computeNow(this.hass!, this.config!)
      })
    }
    if (!this.forecastSubscription) {
      void this.trySubscribeToForecastEvents(this.hass, this.config)
    }
  }

  private _stopClock(): void {
    this._clock?.stop()
    this._clock = null
  }

  private async trySubscribeToForecastEvents(hass: HomeAssistant, config: ClockWeatherCardConfig): Promise<void> {
    if (this.forecastSubscription) return

    try {
      const callback = (_: WeatherForecastEvent): void => {
        // this.forecasts = event.forecast
      }
      const options = { resubscribe: false }
      const message = {
        type: 'weather/subscribe_forecast',
        forecast_type: 'daily', // TODO
        entity_id: configService.getEntity(config)
      }
      this.forecastSubscription = await hass.connection.subscribeMessage<WeatherForecastEvent>(callback, message, options)
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
