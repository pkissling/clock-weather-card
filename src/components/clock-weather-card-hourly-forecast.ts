import '@/components/clock-weather-card-hourly-forecast-item'
import '@/components/clock-weather-card-divider'
import '@/components/clock-weather-card-error'

import type { HomeAssistant } from 'custom-card-helpers'
import type { PropertyValues, TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import configService from '@/service/config-service'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import translationsService from '@/service/translations-service'
import type { ClockWeatherCardConfig, HourlyForecastItem, WeatherForecast } from '@/types'
import { hourlyForecastNotSupported } from '@/utils/errors'
import { computeNow } from '@/utils/luxon'

@customElement('clock-weather-card-hourly-forecast')
class ClockWeatherCardHourlyForecast extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: ClockWeatherCardConfig
  @property({ attribute: false }) public locale!: string
  @state() private forecasts: WeatherForecast[] = []
  private subscription: (() => Promise<void>) | null = null
  private subscribedEntityId: string | null = null
  private syncToken = 0

  public connectedCallback(): void {
    super.connectedCallback()
    void this._syncSubscription()
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    // Invalidate any in-flight subscribe so it tears itself down on resolve.
    this.syncToken++
    void this._unsubscribe()
  }

  public willUpdate(changed: PropertyValues): void {
    if (changed.has('config') || changed.has('hass')) {
      void this._syncSubscription()
    }
  }

  public render(): TemplateResult {
    const entityId = configService.getHourlyForecastEntity(this.config)
    const supported = hassService.supportsForecast(this.hass, entityId, 'hourly')

    if (!supported) {
      return html`
        <clock-weather-card-error
          severity="warning"
          .message=${hourlyForecastNotSupported(entityId).message}
          .hass=${this.hass}
          .config=${this.config}
        ></clock-weather-card-error>
      `
    }

    const hours = configService.getHourlyForecastHours(this.config)
    const sunEntityId = configService.getSunEntity(this.config)
    const timeZone = configService.getTimeZone(this.config, this.hass)
    const animatedIcon = configService.getHourlyForecastAnimatedIcons(this.config)
    const weatherIconType = configService.getHourlyForecastWeatherIconType(this.config)
    const round = configService.getHourlyForecastRoundTemperatures(this.config)
    const temperatureUnit = hassService.getEntityAttributeString(this.hass, entityId, 'temperature_unit')

    const now = computeNow(this.hass, this.config)
    const parsed = this.forecasts.map(forecast => ({
      forecast,
      at: DateTime.fromISO(forecast.datetime)
        .setLocale(this.locale)
        .setZone(timeZone),
    }))
    const nowLabel = translationsService.t(this.locale, 'misc.now')

    // Show every entry strictly after "now" plus the one immediately before — that becomes the "Now" column.
    const firstFutureIdx = parsed.findIndex(({ at }) => at > now)
    if (firstFutureIdx === -1) return html``
    const start = Math.max(0, firstFutureIdx - 1)
    const visible = parsed.slice(start, start + hours)

    // Drop the precipitation row entirely when no visible item has a non-zero probability — avoids
    // a column of empty placeholders for providers that always report 0% or omit the field.
    const showPrecipitation = visible.some(({ forecast }) =>
      (forecast.precipitation_probability ?? 0) > 0,
    )

    return html`
      <clock-weather-card-divider orientation="horizontal"></clock-weather-card-divider>
      <div class="strip">
        ${visible.map(({ forecast, at }) => {
      const item: HourlyForecastItem = {
        label: at <= now ? nowLabel : at.toLocaleString({ hour: 'numeric' }),
        condition: forecast.condition,
        isNight: hassService.isNight(this.hass, sunEntityId, at),
        animatedIcon,
        weatherIconType,
        temperature: round ? Math.round(forecast.temperature) : forecast.temperature,
        temperatureUnit,
        precipitationProbability: forecast.precipitation_probability ?? null,
        showPrecipitation,
      }
      return html`<clock-weather-card-hourly-forecast-item .item=${item}></clock-weather-card-hourly-forecast-item>`
    })}
      </div>
    `
  }

  private async _syncSubscription(): Promise<void> {
    if (!this.hass || !this.config) return
    const token = ++this.syncToken
    const desiredEntityId = configService.getHourlyForecastEntity(this.config)
    const supports = hassService.supportsForecast(this.hass, desiredEntityId, 'hourly')

    if (!supports) {
      if (this.subscription) {
        await this._unsubscribe()
        this.forecasts = []
      }
      return
    }

    if (this.subscription && this.subscribedEntityId === desiredEntityId) return

    if (this.subscription) {
      await this._unsubscribe()
    }
    if (token !== this.syncToken) return

    try {
      const sub = await hassService.subscribeForecast(
        this.hass,
        desiredEntityId,
        'hourly',
        event => {
          if (token !== this.syncToken) return
          this.forecasts = (event.forecast ?? []).map(f => ({
            ...f,
            precipitation_probability: f.precipitation_probability ?? null,
          }))
        },
      )
      if (token !== this.syncToken) {
        // Superseded while awaiting — drop this subscription.
        try { await sub() } catch (_: unknown) { /* swallow */ }
        return
      }
      this.subscription = sub
      this.subscribedEntityId = desiredEntityId
      logger.debug('Subscribed to hourly forecast', desiredEntityId)
    } catch (e: unknown) {
      if (token === this.syncToken) {
        this.subscription = null
        this.subscribedEntityId = null
      }
      logger.error('Error subscribing to hourly forecast', e)
    }
  }

  private async _unsubscribe(): Promise<void> {
    if (!this.subscription) return
    try {
      await this.subscription()
    } catch (_: unknown) {
      // swallow — connection may already be closed
    } finally {
      this.subscription = null
      this.subscribedEntityId = null
    }
  }
}

export default ClockWeatherCardHourlyForecast
