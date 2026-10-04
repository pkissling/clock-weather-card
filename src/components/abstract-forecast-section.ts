import '@/components/clock-weather-card-divider'
import '@/components/clock-weather-card-error'

import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { PropertyValues, TemplateResult } from 'lit'
import { html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext, hassContext } from '@/context'
import forecastSubscriptionService from '@/service/forecast-subscription-service'
import hassService from '@/service/hass-service'
import translationsService from '@/service/translations-service'
import type { ResolvedConfig, SectionForecastType, WeatherForecast } from '@/types'
import { forecastNotSupported } from '@/utils/errors'
import { convertTemperature } from '@/utils/temperature'

export interface ForecastRow {
  forecast: WeatherForecast
  at: DateTime
  isCurrent: boolean
  label: string
  isNight: boolean
}

abstract class AbstractForecastSection extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() protected hass!: HomeAssistant
  @consume({ context: configContext, subscribe: true }) @state() protected config!: ResolvedConfig
  @property({ attribute: false }) public currentDate!: DateTime
  @state() protected forecasts: WeatherForecast[] = []
  // Reflected so e2e tests can wait for the first forecast payload.
  @property({ type: Boolean, reflect: true, attribute: 'data-loaded' }) private _loaded = false

  private unsubscribe: (() => void) | null = null
  private subscribedKey: string | null = null

  protected abstract resolveForecastType(): SectionForecastType
  protected abstract resolveEntityId(): string
  protected abstract renderForecast(entityId: string, forecastType: SectionForecastType): TemplateResult

  public render(): TemplateResult {
    const entityId = this.resolveEntityId()
    const forecastType = this.resolveForecastType()
    if (!hassService.supportsForecast(this.hass, entityId, forecastType)) {
      return html`
        <clock-weather-card-divider orientation="horizontal"></clock-weather-card-divider>
        <clock-weather-card-error
          severity="warning"
          .message=${forecastNotSupported(entityId, forecastType).message}
        ></clock-weather-card-error>
      `
    }
    return this.renderForecast(entityId, forecastType)
  }

  public connectedCallback(): void {
    super.connectedCallback()
    this._syncSubscription()
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    this._unsubscribe()
  }

  public willUpdate(changed: PropertyValues): void {
    if (changed.has('config') || changed.has('hass')) {
      this._syncSubscription()
    }
  }

  /** Hourly: the entry at or before now ("Now") plus upcoming hours. Daily: today ("Today") onwards. Temperatures are in the configured unit. */
  protected visibleRows(count: number): ForecastRow[] {
    const now = this.currentDate
    const { locale, timeZone, sunEntity, temperatureUnit } = this.config
    const sourceUnit = hassService.getEntityAttributeString(this.hass, this.resolveEntityId(), 'temperature_unit')
    const convert = (t: number): number => convertTemperature(t, sourceUnit, temperatureUnit)
    const timed = this.forecasts.map(forecast => ({
      forecast: {
        ...forecast,
        temperature: convert(forecast.temperature),
        templow: typeof forecast.templow === 'number' ? convert(forecast.templow) : forecast.templow,
      },
      at: DateTime.fromISO(forecast.datetime)
        .setLocale(locale)
        .setZone(timeZone),
    }))

    if (this.resolveForecastType() === 'hourly') {
      const firstFutureIdx = timed.findIndex(({ at }) => at > now)
      if (firstFutureIdx === -1) return []
      const start = Math.max(0, firstFutureIdx - 1)
      const nowLabel = translationsService.t(locale, 'misc.now')
      return timed.slice(start, start + count)
        .map(({ forecast, at }) => {
          const isCurrent = at <= now
          return {
            forecast,
            at,
            isCurrent,
            label: isCurrent ? nowLabel : at.toLocaleString({ hour: 'numeric' }),
            isNight: hassService.isNight(this.hass, sunEntity, at),
          }
        })
    }

    const todayIso = now.toISODate()!
    const todayLabel = translationsService.t(locale, 'misc.today')
    return timed
      .filter(({ at }) => at.isValid && at.toISODate()! >= todayIso)
      .slice(0, count)
      .map(({ forecast, at }) => {
        const isCurrent = at.toISODate() === todayIso
        return {
          forecast,
          at,
          isCurrent,
          label: isCurrent ? todayLabel : translationsService.t(locale, `day.${at.weekday}`),
          // A daily entry's `datetime` is only a day marker, so day/night can't be derived from it.
          isNight: isCurrent && hassService.isNight(this.hass, sunEntity),
        }
      })
  }

  private _syncSubscription(): void {
    if (!this.hass || !this.config) return
    const entityId = this.resolveEntityId()
    const forecastType = this.resolveForecastType()

    if (!hassService.supportsForecast(this.hass, entityId, forecastType)) {
      if (this.unsubscribe) {
        this._unsubscribe()
        this.forecasts = []
      }
      this._loaded = true
      return
    }

    const key = `${entityId}|${forecastType}`
    if (this.unsubscribe && this.subscribedKey === key) return

    this._unsubscribe()
    this.forecasts = []
    this._loaded = false
    this.unsubscribe = forecastSubscriptionService.subscribe(this.hass, entityId, forecastType, forecasts => {
      this.forecasts = forecasts
      this._loaded = true
    })
    this.subscribedKey = key
  }

  private _unsubscribe(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
    this.subscribedKey = null
  }
}

export default AbstractForecastSection
