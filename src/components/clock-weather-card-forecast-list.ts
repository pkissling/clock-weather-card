import '@/components/clock-weather-card-forecast-list-item'
import '@/components/clock-weather-card-divider'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement } from 'lit/decorators.js'

import AbstractForecastSection, { type ForecastRow } from '@/components/abstract-forecast-section'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import type { ForecastListItem, SectionForecastType } from '@/types'
import { forecastAttributeValue, formatWithUnit } from '@/utils/forecast-attributes'
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

  protected requiredAttribute(): string | null {
    return this.config.forecastList.attribute
  }

  protected renderForecast(entityId: string, forecastType: SectionForecastType): TemplateResult {
    const { rowHeight, barThickness, gradient, animatedIcons, weatherIconType, attribute } = this.config.forecastList
    const { bars, domain } = attribute === 'temperature'
      ? this._temperatureBars(entityId, forecastType)
      : this._attributeBars(attribute)
    if (bars.length === 0) return html``

    const stops = normalizeGradient(gradient)
    const extent = [...domain, ...bars.flatMap(b => b.span ? [b.span.from, b.span.to] : [])]
    const globalLow = Math.min(...extent)
    const range = Math.max(...extent) - globalLow
    const percentFor = (v: number): number => range === 0
      ? 50
      : Math.max(0, Math.min(100, ((v - globalLow) / range) * 100))

    const rowsStyle = `--cwc-list-row-height: ${rowHeight}; --cwc-list-bar-thickness: ${toBarThicknessCss(barThickness)}`

    return html`
      <clock-weather-card-divider orientation="horizontal"></clock-weather-card-divider>
      <div class="rows" style=${rowsStyle}>
        ${bars.map(({ row, lowLabel, highLabel, span, current }) => {
    const item: ForecastListItem = {
      label: row.label,
      condition: row.forecast.condition,
      isNight: row.isNight,
      animatedIcon: animatedIcons,
      weatherIconType,
      lowLabel,
      highLabel,
      barLowPercent: span ? percentFor(span.from) : 0,
      barHighPercent: span ? percentFor(span.to) : 0,
      gradientStops: span ? gradientStopsForRange(stops, span.from, span.to) : [],
      showCurrentIndicator: current !== null,
      currentTempPercent: current === null ? 0 : percentFor(current),
    }
    return html`<clock-weather-card-forecast-list-item .item=${item}></clock-weather-card-forecast-list-item>`
  })}
      </div>
    `
  }

  private _temperatureBars(entityId: string, forecastType: SectionForecastType): ListBars {
    const { count, roundTemperatures, hideCurrentTempIndicator, attributeUnit } = this.config.forecastList
    const { temperatureUnit } = this.config
    const currentTempRaw = hassService.getWeatherTemperature(this.hass, entityId, 'temperature', temperatureUnit)
    if (currentTempRaw === null && !hideCurrentTempIndicator) {
      logger.debug(`Temperature of "${entityId}" is not numeric, hiding the current temperature indicator`)
    }
    const currentTempC = currentTempRaw === null ? null : toCelsius(currentTempRaw, temperatureUnit)
    const hourly = forecastType === 'hourly'
    const format = (t: number): string => formatWithUnit(roundTemperatures ? Math.round(t) : t, attributeUnit ?? temperatureUnit)

    const bars = this.visibleRows(count)
      .map((row, i, rows) => {
        const tempValues = hourly
          ? [row.forecast.temperature, i === 0 ? currentTempRaw ?? row.forecast.temperature : rows[i - 1].forecast.temperature]
          : [row.forecast.templow ?? row.forecast.temperature, row.forecast.temperature]
        // Some integrations leave today's forecasted `temperature` below the current value; keep the dot inside the bar.
        if (!hourly && row.isCurrent && currentTempRaw !== null) tempValues.push(currentTempRaw)
        const lowRaw = Math.min(...tempValues)
        const highRaw = Math.max(...tempValues)
        return {
          row,
          lowLabel: format(lowRaw),
          highLabel: format(highRaw),
          span: { from: toCelsius(lowRaw, temperatureUnit), to: toCelsius(highRaw, temperatureUnit) },
          current: row.isCurrent && !hideCurrentTempIndicator ? currentTempC : null,
        }
      })
    return { bars, domain: [] }
  }

  private _attributeBars(attribute: string): ListBars {
    const unit = this.config.forecastList.attributeUnit ?? this.forecastAttributeUnit(attribute)
    const bars = this.visibleRows(this.config.forecastList.count)
      .map((row) => {
        const value = forecastAttributeValue(row.forecast, attribute)
        return {
          row,
          lowLabel: null,
          highLabel: value === null ? null : formatWithUnit(value, unit),
          span: value === null ? null : { from: Math.min(0, value), to: Math.max(0, value) },
          current: null,
        }
      })
    return { bars, domain: [0] }
  }
}

interface ListBars {
  bars: {
    row: ForecastRow
    lowLabel: string | null
    highLabel: string | null
    span: { from: number, to: number } | null
    current: number | null
  }[]
  domain: number[]
}

export default ClockWeatherCardForecastList
