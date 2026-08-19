import type { HomeAssistant } from 'custom-card-helpers'
import type { PropertyValues } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import type { ClockWeatherCardConfig, ForecastType, WeatherForecast } from '@/types'

abstract class AbstractForecastSection<F extends WeatherForecast = WeatherForecast> extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: ClockWeatherCardConfig
  @property({ attribute: false }) public currentDate!: DateTime
  @property({ attribute: false }) public locale!: string
  @state() protected forecasts: F[] = []

  private subscription: (() => Promise<void>) | null = null
  private subscribedEntityId: string | null = null
  private syncToken = 0

  protected abstract readonly forecastType: ForecastType
  protected abstract resolveEntityId(): string

  // Hook for subclasses that need to massage the raw HA payload (e.g. normalize missing
  // precipitation_probability). Defaults to a passthrough cast.
  protected normalizeForecasts(raw: WeatherForecast[]): F[] {
    return raw as F[]
  }

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

  private async _syncSubscription(): Promise<void> {
    if (!this.hass || !this.config) return
    const token = ++this.syncToken
    const desiredEntityId = this.resolveEntityId()
    const supports = hassService.supportsForecast(this.hass, desiredEntityId, this.forecastType)

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
        this.forecastType,
        event => {
          if (token !== this.syncToken) return
          this.forecasts = this.normalizeForecasts(event.forecast ?? [])
        },
      )
      if (token !== this.syncToken) {
        // Superseded while awaiting — drop this subscription.
        try { await sub() } catch (_: unknown) { /* swallow */ }
        return
      }
      this.subscription = sub
      this.subscribedEntityId = desiredEntityId
      logger.debug(`Subscribed to ${this.forecastType} forecast`, desiredEntityId)
    } catch (e: unknown) {
      if (token === this.syncToken) {
        this.subscription = null
        this.subscribedEntityId = null
      }
      logger.error(`Error subscribing to ${this.forecastType} forecast`, e)
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

export default AbstractForecastSection
