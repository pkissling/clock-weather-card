import '@/components/clock-weather-card-daily-forecast-item'
import '@/components/clock-weather-card-divider'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import AbstractForecastSection from '@/components/abstract-forecast-section'
import hassService from '@/service/hass-service'
import translationsService from '@/service/translations-service'
import type { DailyForecastItem, DailyWeatherForecast, ForecastType } from '@/types'
import { gradientStopsForRange, normalizeGradient, toCelsius } from '@/utils/gradient'

/**
 * A percentage `bar_thickness` is relative to the row height (a CSS `%` height would resolve against
 * the grid area instead), so translate it into a `calc()` on the row-height variable.
 */
const toBarThicknessCss = (thickness: string): string => {
  const percent = /^(\d+(?:\.\d+)?)%$/.exec(thickness.trim())
  return percent
    ? `calc(var(--cwc-daily-row-height, 28px) * ${Number(percent[1]) / 100})`
    : thickness
}

@customElement('clock-weather-card-daily-forecast')
class ClockWeatherCardDailyForecast extends AbstractForecastSection<DailyWeatherForecast> {
  protected readonly forecastType: ForecastType = 'daily'

  protected resolveEntityId(): string {
    return this.config.forecastList.entity
  }

  protected renderForecast(entityId: string): TemplateResult {
    const { sunEntity, timeZone, locale } = this.config
    const {
      count, animatedIcons, weatherIconType, roundTemperatures,
      hideCurrentTempIndicator, gradient, rowHeight, barThickness,
    } = this.config.forecastList
    const temperatureUnit = hassService.getEntityAttributeString(this.hass, entityId, 'temperature_unit')
    const currentTemp = hassService.getEntityAttribute(this.hass, entityId, 'temperature')
    const stops = normalizeGradient(gradient)

    const currentTempRaw = typeof currentTemp === 'number' && Number.isFinite(currentTemp) ? currentTemp : null
    const currentTempC = currentTempRaw === null ? null : toCelsius(currentTempRaw, temperatureUnit)
    const todayIso = this.currentDate.toISODate()
    const parsed = this.forecasts
      .map(forecast => {
        const at = DateTime.fromISO(forecast.datetime)
          .setLocale(locale)
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

    const visible = parsed.slice(0, count)
    const globalLowC = Math.min(...visible.map(v => v.lowC))
    const globalHighC = Math.max(...visible.map(v => v.highC))
    const range = globalHighC - globalLowC
    const percentFor = (c: number): number => range === 0
      ? 50
      : Math.max(0, Math.min(100, ((c - globalLowC) / range) * 100))

    const todayLabel = translationsService.t(locale, 'misc.today')

    const rowsStyle = [
      rowHeight ? `--cwc-daily-row-height: ${rowHeight}` : null,
      `--cwc-daily-bar-thickness: ${toBarThicknessCss(barThickness)}`,
    ].filter(Boolean)
      .join('; ')

    return html`
      <clock-weather-card-divider orientation="horizontal"></clock-weather-card-divider>
      <div class="rows" style=${rowsStyle}>
        ${visible.map(({ forecast, at, isToday, lowRaw, highRaw, lowC, highC }) => {
    const showCurrentIndicator = isToday && !hideCurrentTempIndicator && currentTempC !== null
    const item: DailyForecastItem = {
      label: isToday ? todayLabel : translationsService.t(locale, `day.${at.weekday}`),
      condition: forecast.condition,
      // A daily entry's `datetime` is only a day marker, so day/night can't be derived from it.
      isNight: isToday && hassService.isNight(this.hass, sunEntity),
      animatedIcon: animatedIcons,
      weatherIconType,
      temperatureLow: roundTemperatures ? Math.round(lowRaw) : lowRaw,
      temperatureHigh: roundTemperatures ? Math.round(highRaw) : highRaw,
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
