import '@/components/clock-weather-card-daily-forecast-item'
import '@/components/clock-weather-card-divider'
import '@/components/clock-weather-card-error'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import AbstractForecastSection from '@/components/abstract-forecast-section'
import configService from '@/service/config-service'
import hassService from '@/service/hass-service'
import translationsService from '@/service/translations-service'
import type { DailyForecastItem, DailyWeatherForecast, ForecastType } from '@/types'
import { forecastNotSupported } from '@/utils/errors'
import { gradientStopsForRange, normalizeGradient, toCelsius } from '@/utils/gradient'

@customElement('clock-weather-card-daily-forecast')
class ClockWeatherCardDailyForecast extends AbstractForecastSection<DailyWeatherForecast> {
  protected readonly forecastType: ForecastType = 'daily'

  protected resolveEntityId(): string {
    return configService.getDaily(this.config)
      .getEntity()
  }

  public render(): TemplateResult {
    const entityId = this.resolveEntityId()
    const supported = hassService.supportsForecast(this.hass, entityId, this.forecastType)

    if (!supported) {
      return html`
        <clock-weather-card-divider orientation="horizontal"></clock-weather-card-divider>
        <clock-weather-card-error
          severity="warning"
          .message=${forecastNotSupported(entityId, this.forecastType).message}
          .hass=${this.hass}
          .config=${this.config}
        ></clock-weather-card-error>
      `
    }

    const dailyConfig = configService.getDaily(this.config)
    const maxRows = dailyConfig.getRows()
    const sunEntityId = configService.getSunEntity(this.config)
    const timeZone = configService.getTimeZone(this.config, this.hass)
    const animatedIcon = dailyConfig.getAnimatedIcons()
    const weatherIconType = dailyConfig.getWeatherIconType()
    const round = dailyConfig.getRoundTemperatures()
    const hideCurrentTempIndicator = dailyConfig.isCurrentTempIndicatorHidden()
    const temperatureUnit = hassService.getEntityAttributeString(this.hass, entityId, 'temperature_unit')
    const currentTemp = hassService.getEntityAttribute(this.hass, entityId, 'temperature')
    const stops = normalizeGradient(dailyConfig.getGradient())

    const currentTempRaw = typeof currentTemp === 'number' && Number.isFinite(currentTemp) ? currentTemp : null
    const currentTempC = currentTempRaw === null ? null : toCelsius(currentTempRaw, temperatureUnit)
    const todayIso = this.currentDate.toISODate()
    const parsed = this.forecasts
      .map(forecast => {
        const at = DateTime.fromISO(forecast.datetime)
          .setLocale(this.locale)
          .setZone(timeZone)
        const isToday = at.toISODate() === todayIso
        // For today's row, fold the current temperature into the day's range so the dot is
        // always inside the colored bar — some HA integrations leave today's forecasted
        // `temperature` below the actual current value when the daily high hasn't settled.
        // For other rows, sort defensively in case `templow`/`temperature` arrive inverted.
        const tempValues = [forecast.templow, forecast.temperature]
        if (isToday && currentTempRaw !== null) tempValues.push(currentTempRaw)
        const lowRaw = Math.min(...tempValues)
        const highRaw = Math.max(...tempValues)
        return {
          forecast,
          at,
          isToday,
          lowRaw,
          highRaw,
          lowC: toCelsius(lowRaw, temperatureUnit),
          highC: toCelsius(highRaw, temperatureUnit),
        }
      })
      .filter(({ at }) => at.isValid && at.toISODate()! >= todayIso!)

    if (parsed.length === 0) return html``

    const visible = parsed.slice(0, maxRows)
    const globalLowC = Math.min(...visible.map(v => v.lowC))
    const globalHighC = Math.max(...visible.map(v => v.highC))
    const range = globalHighC - globalLowC
    const percentFor = (c: number): number => range === 0
      ? 50
      : Math.max(0, Math.min(100, ((c - globalLowC) / range) * 100))

    const todayLabel = translationsService.t(this.locale, 'misc.today')

    const rowHeight = dailyConfig.getRowHeight()
    const barRatio = dailyConfig.getBarHeightRatio()
    const rowsStyle = [
      rowHeight ? `--cwc-daily-row-height: ${rowHeight}` : null,
      `--cwc-daily-bar-ratio: ${barRatio}`,
    ].filter(Boolean)
      .join('; ')

    return html`
      <clock-weather-card-divider orientation="horizontal"></clock-weather-card-divider>
      <div class="rows" style=${rowsStyle}>
        ${visible.map(({ forecast, at, isToday, lowRaw, highRaw, lowC, highC }) => {
    const showCurrentIndicator = isToday && !hideCurrentTempIndicator && currentTempC !== null
    const item: DailyForecastItem = {
      label: isToday ? todayLabel : translationsService.t(this.locale, `day.${at.weekday}`),
      condition: forecast.condition,
      isNight: hassService.isNight(this.hass, sunEntityId, at),
      animatedIcon,
      weatherIconType,
      temperatureLow: round ? Math.round(lowRaw) : lowRaw,
      temperatureHigh: round ? Math.round(highRaw) : highRaw,
      temperatureUnit,
      barLowPercent: percentFor(lowC),
      barHighPercent: percentFor(highC),
      gradientStops: gradientStopsForRange(stops, lowC, highC),
      showCurrentIndicator,
      currentTempPercent: showCurrentIndicator ? percentFor(currentTempC!) : 0,
    }
    return html`<clock-weather-card-daily-forecast-item .item=${item}></clock-weather-card-daily-forecast-item>`
  })}
      </div>
    `
  }
}

export default ClockWeatherCardDailyForecast
