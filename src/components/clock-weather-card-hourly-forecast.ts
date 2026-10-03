import '@/components/clock-weather-card-hourly-forecast-item'
import '@/components/clock-weather-card-divider'
import '@/components/clock-weather-card-error'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import AbstractForecastSection from '@/components/abstract-forecast-section'
import hassService from '@/service/hass-service'
import translationsService from '@/service/translations-service'
import type { ForecastType, HourlyForecastItem, WeatherForecast } from '@/types'
import { forecastNotSupported } from '@/utils/errors'

@customElement('clock-weather-card-hourly-forecast')
class ClockWeatherCardHourlyForecast extends AbstractForecastSection {
  protected readonly forecastType: ForecastType = 'hourly'

  protected resolveEntityId(): string {
    return this.config.forecastStrip.entity
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
        ></clock-weather-card-error>
      `
    }

    const { sunEntity, timeZone, locale } = this.config
    const { count, animatedIcons, weatherIconType, roundTemperatures, hideSunriseSunset } = this.config.forecastStrip
    const temperatureUnit = hassService.getEntityAttributeString(this.hass, entityId, 'temperature_unit')

    const now = this.currentDate
    const parsed = this.forecasts.map(forecast => ({
      forecast,
      at: DateTime.fromISO(forecast.datetime)
        .setLocale(locale)
        .setZone(timeZone),
    }))
    const nowLabel = translationsService.t(locale, 'misc.now')

    // Show every entry strictly after "now" plus the one immediately before — that becomes the "Now" column.
    const firstFutureIdx = parsed.findIndex(({ at }) => at > now)
    if (firstFutureIdx === -1) return html``
    const start = Math.max(0, firstFutureIdx - 1)
    const visible = parsed.slice(start, start + count)

    // Drop the precipitation row entirely if rounded precipitation never above 0%
    const showPrecipitation = visible.some(({ forecast }) => (roundToTens(forecast.precipitation_probability) ?? 0) > 0)

    const hourItems = visible.map(({ forecast, at }): { at: DateTime, item: HourlyForecastItem } => ({
      at,
      item: {
        label: at <= now ? nowLabel : at.toLocaleString({ hour: 'numeric' }),
        condition: forecast.condition,
        isNight: hassService.isNight(this.hass, sunEntity, at),
        animatedIcon: animatedIcons,
        weatherIconType,
        temperature: roundTemperatures ? Math.round(forecast.temperature) : forecast.temperature,
        temperatureUnit,
        precipitationProbability: roundToTens(forecast.precipitation_probability),
        showPrecipitation,
      },
    }))

    const lastAt = visible[visible.length - 1].at
    const { sunrise, sunset } = hideSunriseSunset
      ? { sunrise: null, sunset: null }
      : hassService.getNextSunEvents(this.hass, sunEntity, timeZone)
    const sunItems = ([['sunrise', sunrise], ['sunset', sunset]] as const)
      .flatMap(([kind, at]) => at && at.startOf('minute') >= now.startOf('minute') && at <= lastAt ? [{ kind, at }] : [])
      .map(({ kind, at }): { at: DateTime, item: HourlyForecastItem } => ({
        at,
        item: {
          label: at.toLocaleString(DateTime.TIME_SIMPLE, { locale }),
          condition: kind,
          isNight: false,
          animatedIcon: animatedIcons,
          weatherIconType,
          sunEvent: { kind, label: translationsService.t(locale, kind === 'sunrise' ? 'misc.sunrise' : 'misc.sunset') },
          precipitationProbability: null,
          showPrecipitation,
        },
      }))

    const items = [...hourItems, ...sunItems].sort((x, y) => x.at.toMillis() - y.at.toMillis())
      .slice(0, count)

    return html`
      <clock-weather-card-divider orientation="horizontal"></clock-weather-card-divider>
      <div class="strip">
        ${items.map(({ item }) => html`<clock-weather-card-hourly-forecast-item .item=${item}></clock-weather-card-hourly-forecast-item>`)}
      </div>
    `
  }
}

const roundToTens = (value: number | null | undefined): number | null =>
  value === null || value === undefined ? null : Math.round(value / 10) * 10

export default ClockWeatherCardHourlyForecast
