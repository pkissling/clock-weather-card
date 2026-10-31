import '@/components/clock-weather-card-forecast-strip-item'
import '@/components/clock-weather-card-divider'

import type { TemplateResult } from 'lit'
import { html, nothing } from 'lit'
import type { DateTime } from 'luxon'

import AbstractForecastSection from '@/components/abstract-forecast-section'
import hassService from '@/service/hass-service'
import translationsService from '@/service/translations-service'
import type { ForecastStripItem, SectionForecastType } from '@/types'
import { customElement } from '@/utils/custom-element'
import { forecastAttributeValue, formatWithUnit } from '@/utils/forecast-attributes'
import { formatNumber } from '@/utils/number'

@customElement('clock-weather-card-forecast-strip')
class ClockWeatherCardForecastStrip extends AbstractForecastSection {
  protected resolveForecastType(): SectionForecastType {
    return this.config.forecast_strip.forecast_type
  }

  protected resolveEntityId(): string {
    return this.config.forecast_strip.weather_entity
  }

  protected requiredAttribute(): string | null {
    const { attribute, attributeRequired } = this.config.forecast_strip
    return attributeRequired ? attribute : null
  }

  protected renderSkeleton(): TemplateResult {
    return html`
      <clock-weather-card-divider></clock-weather-card-divider>
      <div class="strip" aria-busy="true" style=${this._stripStyle()}>
        ${Array.from({ length: this.config.forecast_strip.count }, () => html`
          <div class="skeleton-item">
            <span class="skeleton skeleton--time"></span>
            <span class="skeleton skeleton--icon"></span>
            <span class="skeleton skeleton--label"></span>
            ${this.config.forecast_strip.hide_attribute ? nothing : html`<span class="skeleton skeleton--attribute"></span>`}
          </div>
        `)}
      </div>
    `
  }

  protected renderForecast(_entityId: string, forecastType: SectionForecastType): TemplateResult {
    const { sun_entity, timeZone, locale, temperatureUnit, temperatureSensor } = this.config
    const { count, animated_icons, weather_icon_type, round_temperatures, hide_sunrise_sunset, time_pattern, attribute, hide_attribute, attribute_icon, attribute_color, attribute_unit } = this.config.forecast_strip
    const now = this.currentDate

    const visible = this.visibleRows(count, time_pattern)
    if (visible.length === 0) return html``

    const roundTemperature = (t: number | null): string | null => t === null ? null : formatNumber(round_temperatures ? Math.round(t) : t, this.config)

    const unit = attribute_unit ?? this.forecastAttributeUnit(attribute)
    const roundAttribute = (v: number | null): number | null => v !== null && attribute === 'precipitation_probability' ? Math.round(v / 10) * 10 : v
    const hideZero = attribute === 'precipitation' || attribute === 'precipitation_probability'
    const attributeValues = visible.map(({ forecast }) => roundAttribute(forecastAttributeValue(forecast, attribute)))
      .map(v => hideZero && v === 0 ? null : v)
    const attributeItem = (value: number | null): ForecastStripItem['attribute'] => hide_attribute
      ? null
      : { icon: attribute_icon, color: attribute_color, value: value === null ? null : formatWithUnit(formatNumber(value, this.config), unit) }

    const sensorTemperature = forecastType === 'hourly' ? hassService.getSensorTemperature(this.hass, temperatureSensor, temperatureUnit) : null

    const forecastItems = visible.map(({ forecast, at, label, isNight, isCurrent }, i): { at: DateTime, item: ForecastStripItem } => {
      const templow = forecastType === 'daily' ? forecast.templow ?? null : null
      const temperature = isCurrent && sensorTemperature !== null ? sensorTemperature : forecast.temperature ?? null
      return {
        at,
        item: {
          label,
          condition: forecast.condition ?? '',
          isNight,
          animatedIcon: animated_icons,
          weatherIconType: weather_icon_type,
          temperature: roundTemperature(templow === null || temperature === null ? temperature : Math.max(temperature, templow)),
          temperatureLow: templow === null ? null : roundTemperature(temperature === null ? templow : Math.min(temperature, templow)),
          temperatureUnit,
          attribute: attributeItem(attributeValues[i]),
        },
      }
    })

    const lastAt = visible[visible.length - 1].at
    const { sunrise, sunset } = hide_sunrise_sunset || forecastType !== 'hourly'
      ? { sunrise: null, sunset: null }
      : hassService.getNextSunEvents(this.hass, sun_entity, timeZone)
    const sunItems = ([['sunrise', sunrise], ['sunset', sunset]] as const)
      .flatMap(([kind, at]) => at && at.startOf('minute') >= now.startOf('minute') && at <= lastAt ? [{ kind, at }] : [])
      .map(({ kind, at }): { at: DateTime, item: ForecastStripItem } => ({
        at,
        item: {
          label: at.setLocale(locale)
            .toFormat(time_pattern),
          condition: kind,
          isNight: false,
          animatedIcon: animated_icons,
          weatherIconType: weather_icon_type,
          sunEvent: { kind, label: translationsService.t(locale, kind === 'sunrise' ? 'misc.sunrise' : 'misc.sunset') },
          attribute: attributeItem(null),
        },
      }))

    const items = [...forecastItems, ...sunItems].sort((x, y) => x.at.toMillis() - y.at.toMillis())
      .slice(0, count)

    return html`
      <clock-weather-card-divider></clock-weather-card-divider>
      <div class="strip" style=${this._stripStyle()}>
        ${items.map(({ item }) => html`<clock-weather-card-forecast-strip-item .item=${item}></clock-weather-card-forecast-strip-item>`)}
      </div>
    `
  }

  private _stripStyle(): string {
    const { font_size } = this.config.forecast_strip
    return font_size ? `font-size: ${font_size}; --cwc-strip-icon-size: 2.5em` : ''
  }
}

export default ClockWeatherCardForecastStrip
