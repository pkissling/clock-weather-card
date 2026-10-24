import '@/components/clock-weather-card-forecast-list-item'
import '@/components/clock-weather-card-divider'

import type { TemplateResult } from 'lit'
import { html } from 'lit'

import AbstractForecastSection, { type ForecastRow } from '@/components/abstract-forecast-section'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import type { ForecastListItem, SectionForecastType } from '@/types'
import { customElement } from '@/utils/custom-element'
import { forecastAttributeValue, formatWithUnit, MISSING_VALUE } from '@/utils/forecast-attributes'
import { gradientStopsForRange, normalizeGradient } from '@/utils/gradient'
import { formatNumber } from '@/utils/number'
import { toCelsius } from '@/utils/temperature'

// A CSS % height would resolve against the grid area, so a percentage is made relative to the row height.
const toBarThicknessCss = (thickness: string): string => {
  const percent = /^(\d+(?:\.\d+)?)%$/.exec(thickness.trim())
  return percent
    ? `calc(var(--cwc-list-row-height) * ${Number(percent[1]) / 100})`
    : thickness
}

@customElement('clock-weather-card-forecast-list')
class ClockWeatherCardForecastList extends AbstractForecastSection {
  protected resolveForecastType(): SectionForecastType {
    return this.config.forecast_list.forecast_type
  }

  protected resolveEntityId(): string {
    return this.config.forecast_list.weather_entity
  }

  protected requiredAttribute(): string | null {
    return this.config.forecast_list.attribute
  }

  protected renderSkeleton(): TemplateResult {
    return html`
      <clock-weather-card-divider></clock-weather-card-divider>
      <div class="rows" aria-busy="true" style=${this._rowsStyle()}>
        ${Array.from({ length: this.config.forecast_list.count }, () => html`
          <span class="skeleton skeleton--label"></span>
          <span class="skeleton skeleton--icon"></span>
          <span class="skeleton skeleton--temperature"></span>
          <span class="skeleton skeleton--bar"></span>
          <span class="skeleton skeleton--temperature"></span>
        `)}
      </div>
    `
  }

  protected renderForecast(entityId: string, forecastType: SectionForecastType): TemplateResult {
    const { gradient, animated_icons, weather_icon_type, attribute } = this.config.forecast_list
    const bars = attribute === 'temperature'
      ? this._temperatureBars(entityId, forecastType)
      : this._attributeBars(attribute)
    if (bars.length === 0) return html``

    const stops = normalizeGradient(gradient)
    const extent = bars.flatMap(b => b.span ? [b.span.from, b.span.to] : [])
    const globalLow = Math.min(...extent)
    const range = Math.max(...extent) - globalLow
    const percentFor = (v: number): number => range === 0
      ? 50
      : Math.max(0, Math.min(100, ((v - globalLow) / range) * 100))

    return html`
      <clock-weather-card-divider></clock-weather-card-divider>
      <div class="rows" style=${this._rowsStyle()}>
        ${bars.map(({ row, lowLabel, highLabel, span, current }) => {
    const item: ForecastListItem = {
      label: row.label,
      condition: row.forecast.condition ?? '',
      isNight: row.isNight,
      animatedIcon: animated_icons,
      weatherIconType: weather_icon_type,
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

  private _rowsStyle(): string {
    const { row_height, bar_thickness } = this.config.forecast_list
    return `--cwc-list-row-height: ${row_height}; --cwc-list-bar-thickness: ${toBarThicknessCss(bar_thickness)}`
  }

  private _temperatureBars(entityId: string, forecastType: SectionForecastType): ListBar[] {
    const { count, round_temperatures, hide_current_temp_indicator, attribute_unit, time_pattern } = this.config.forecast_list
    const { temperatureUnit, temperatureSensor } = this.config
    const currentTempRaw = hassService.getCurrentTemperature(this.hass, entityId, temperatureSensor, temperatureUnit)
    if (currentTempRaw === null && !hide_current_temp_indicator) {
      logger.debug(`Temperature of "${temperatureSensor ?? entityId}" is not numeric, hiding the current temperature indicator`)
    }
    const currentTempC = currentTempRaw === null ? null : toCelsius(currentTempRaw, temperatureUnit)
    const hourly = forecastType === 'hourly'
    const format = (t: number): string => formatWithUnit(formatNumber(round_temperatures ? Math.round(t) : t, this.config), attribute_unit ?? temperatureUnit)

    return this.visibleRows(count, time_pattern)
      .map((row, i, rows) => {
        const tempValues = (hourly
          ? [row.forecast.temperature, i === 0 ? currentTempRaw ?? row.forecast.temperature : rows[i - 1].forecast.temperature]
          : [row.forecast.templow ?? row.forecast.temperature, row.forecast.temperature])
          .filter((t): t is number => typeof t === 'number')
        // Some integrations leave today's forecasted `temperature` below the current value; keep the dot inside the bar.
        if (!hourly && row.isCurrent && currentTempRaw !== null) tempValues.push(currentTempRaw)
        if (tempValues.length === 0) return { row, lowLabel: MISSING_VALUE, highLabel: MISSING_VALUE, span: null, current: null }
        const lowRaw = Math.min(...tempValues)
        const highRaw = Math.max(...tempValues)
        return {
          row,
          lowLabel: format(lowRaw),
          highLabel: format(highRaw),
          span: { from: toCelsius(lowRaw, temperatureUnit), to: toCelsius(highRaw, temperatureUnit) },
          current: row.isCurrent && !hide_current_temp_indicator ? currentTempC : null,
        }
      })
  }

  private _attributeBars(attribute: string): ListBar[] {
    const { attribute_unit, count, time_pattern } = this.config.forecast_list
    const unit = attribute_unit ?? this.forecastAttributeUnit(attribute)
    return this.visibleRows(count, time_pattern)
      .map((row) => {
        const value = forecastAttributeValue(row.forecast, attribute)
        return {
          row,
          lowLabel: null,
          highLabel: value === null ? null : formatWithUnit(formatNumber(value, this.config), unit),
          span: value === null ? null : { from: Math.min(0, value), to: Math.max(0, value) },
          current: null,
        }
      })
  }
}

interface ListBar {
  row: ForecastRow
  lowLabel: string | null
  highLabel: string | null
  span: { from: number, to: number } | null
  current: number | null
}

export default ClockWeatherCardForecastList
