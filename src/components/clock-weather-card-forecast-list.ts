import '@/components/clock-weather-card-forecast-list-item'
import '@/components/clock-weather-card-divider'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement } from 'lit/decorators.js'

import AbstractForecastSection from '@/components/abstract-forecast-section'
import hassService from '@/service/hass-service'
import type { ForecastListItem, SectionForecastType } from '@/types'
import { gradientStopsForRange, normalizeGradient } from '@/utils/gradient'
import { toCelsius } from '@/utils/temperature'

/**
 * A percentage `bar_thickness` is relative to the row height (a CSS `%` height would resolve against
 * the grid area instead), so translate it into a `calc()` on the row-height variable.
 */
const toBarThicknessCss = (thickness: string): string => {
  const percent = /^(\d+(?:\.\d+)?)%$/.exec(thickness.trim())
  return percent
    ? `calc(var(--cwc-list-row-height) * ${Number(percent[1]) / 100})`
    : thickness
}

@customElement('clock-weather-card-forecast-list')
class ClockWeatherCardForecastList extends AbstractForecastSection {
  protected resolveForecastType(): SectionForecastType {
    return this.config.forecastList.forecastType
  }

  protected resolveEntityId(): string {
    return this.config.forecastList.entity
  }

  protected renderForecast(entityId: string, forecastType: SectionForecastType): TemplateResult {
    const {
      count, animatedIcons, weatherIconType, roundTemperatures,
      hideCurrentTempIndicator, gradient, rowHeight, barThickness,
    } = this.config.forecastList
    const { temperatureUnit } = this.config
    const stops = normalizeGradient(gradient)

    const currentTempRaw = hassService.getWeatherTemperature(this.hass, entityId, 'temperature', temperatureUnit)
    const currentTempC = currentTempRaw === null ? null : toCelsius(currentTempRaw, temperatureUnit)
    const hourly = forecastType === 'hourly'
    const visible = this.visibleRows(count)
      .map((row, i, rows) => {
        const tempValues = hourly
          ? [row.forecast.temperature, i === 0 ? currentTempRaw ?? row.forecast.temperature : rows[i - 1].forecast.temperature]
          : [row.forecast.templow ?? row.forecast.temperature, row.forecast.temperature]
        // Some integrations leave today's forecasted `temperature` below the current value; keep the dot inside the bar.
        if (!hourly && row.isCurrent && currentTempRaw !== null) tempValues.push(currentTempRaw)
        const lowRaw = Math.min(...tempValues)
        const highRaw = Math.max(...tempValues)
        return {
          ...row,
          lowRaw,
          highRaw,
          lowC: toCelsius(lowRaw, temperatureUnit),
          highC: toCelsius(highRaw, temperatureUnit),
        }
      })

    if (visible.length === 0) return html``

    const globalLowC = Math.min(...visible.map(v => v.lowC))
    const globalHighC = Math.max(...visible.map(v => v.highC))
    const range = globalHighC - globalLowC
    const percentFor = (c: number): number => range === 0
      ? 50
      : Math.max(0, Math.min(100, ((c - globalLowC) / range) * 100))

    const rowsStyle = `--cwc-list-row-height: ${rowHeight}; --cwc-list-bar-thickness: ${toBarThicknessCss(barThickness)}`

    return html`
      <clock-weather-card-divider orientation="horizontal"></clock-weather-card-divider>
      <div class="rows" style=${rowsStyle}>
        ${visible.map(({ forecast, label, isNight, isCurrent, lowRaw, highRaw, lowC, highC }) => {
    const showCurrentIndicator = isCurrent && !hideCurrentTempIndicator && currentTempC !== null
    const item: ForecastListItem = {
      label,
      condition: forecast.condition,
      isNight,
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
    return html`<clock-weather-card-forecast-list-item .item=${item}></clock-weather-card-forecast-list-item>`
  })}
      </div>
    `
  }
}

export default ClockWeatherCardForecastList
