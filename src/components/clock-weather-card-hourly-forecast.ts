import '@/components/clock-weather-card-hourly-forecast-item'
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
import type { ForecastType, HourlyForecastItem, WeatherForecast } from '@/types'
import { forecastNotSupported } from '@/utils/errors'

@customElement('clock-weather-card-hourly-forecast')
class ClockWeatherCardHourlyForecast extends AbstractForecastSection {
  protected readonly forecastType: ForecastType = 'hourly'

  protected resolveEntityId(): string {
    return configService.getHourly(this.config)
      .getEntity()
  }

  protected normalizeForecasts(raw: WeatherForecast[]): WeatherForecast[] {
    return raw.map(f => ({
      ...f,
      precipitation_probability: f.precipitation_probability ?? null,
    }))
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

    const hourlyConfig = configService.getHourly(this.config)
    const hours = hourlyConfig.getHours()
    const sunEntityId = configService.getSunEntity(this.config)
    const timeZone = configService.getTimeZone(this.config, this.hass)
    const animatedIcon = hourlyConfig.getAnimatedIcons()
    const weatherIconType = hourlyConfig.getWeatherIconType()
    const round = hourlyConfig.getRoundTemperatures()
    const temperatureUnit = hassService.getEntityAttributeString(this.hass, entityId, 'temperature_unit')

    const now = this.currentDate
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

    // Drop the precipitation row entirely if rounded precipitation never above 0%
    const showPrecipitation = visible.some(({ forecast }) => (roundToTens(forecast.precipitation_probability) ?? 0) > 0)

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
      precipitationProbability: roundToTens(forecast.precipitation_probability),
      showPrecipitation,
    }
    return html`<clock-weather-card-hourly-forecast-item .item=${item}></clock-weather-card-hourly-forecast-item>`
  })}
      </div>
    `
  }
}

const roundToTens = (value: number | null | undefined): number | null =>
  value === null || value === undefined ? null : Math.round(value / 10) * 10

export default ClockWeatherCardHourlyForecast
