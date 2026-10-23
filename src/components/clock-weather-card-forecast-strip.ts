import '@/components/clock-weather-card-forecast-strip-item'
import '@/components/clock-weather-card-divider'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
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
    return this.config.forecastStrip.forecastType
  }

  protected resolveEntityId(): string {
    return this.config.forecastStrip.entity
  }

  protected requiredAttributes(): string[] {
    const { attributes, attributesRequired } = this.config.forecastStrip
    return attributesRequired ? attributes.map(a => a.attribute) : []
  }

  protected renderSkeleton(): TemplateResult {
    return html`
      <clock-weather-card-divider></clock-weather-card-divider>
      <div class="strip" aria-busy="true">
        ${Array.from({ length: this.config.forecastStrip.count }, () => html`
          <div class="skeleton-item">
            <span class="skeleton skeleton--time"></span>
            <span class="skeleton skeleton--icon"></span>
            <span class="skeleton skeleton--label"></span>
          </div>
        `)}
      </div>
    `
  }

  protected renderForecast(_entityId: string, forecastType: SectionForecastType): TemplateResult {
    const { sunEntity, timeZone, locale, temperatureUnit, temperatureSensor } = this.config
    const { count, animatedIcons, weatherIconType, roundTemperatures, hideSunriseSunset, timePattern, attributes } = this.config.forecastStrip
    const now = this.currentDate

    const visible = this.visibleRows(count, timePattern)
    if (visible.length === 0) return html``

    const roundTemperature = (t: number): string => formatNumber(roundTemperatures ? Math.round(t) : t, this.config)

    const roundAttribute = (attribute: string, v: number | null): number | null => v !== null && attribute === 'precipitation_probability' ? Math.round(v / 10) * 10 : v
    const attributeRows = attributes.map(({ attribute, icon, color, unit }) => {
      const values = visible.map(({ forecast }) => roundAttribute(attribute, forecastAttributeValue(forecast, attribute)))
      return { icon, color, unit: unit ?? this.forecastAttributeUnit(attribute), values }
    })
      .filter(({ values }) => values.some(v => v !== null))
    const attributeItems = (index: number | null): ForecastStripItem['attributes'] => attributeRows.map(({ icon, color, unit, values }) => {
      const value = index === null ? null : values[index]
      return { icon, color, value: value === null ? null : formatWithUnit(formatNumber(value, this.config), unit) }
    })

    const sensorTemperature = forecastType === 'hourly' ? hassService.getSensorTemperature(this.hass, temperatureSensor, temperatureUnit) : null

    const forecastItems = visible.map(({ forecast, at, label, isNight, isCurrent }, i): { at: DateTime, item: ForecastStripItem } => {
      const templow = forecastType === 'daily' ? forecast.templow ?? null : null
      const temperature = isCurrent && sensorTemperature !== null ? sensorTemperature : forecast.temperature
      return {
        at,
        item: {
          label,
          condition: forecast.condition,
          isNight,
          animatedIcon: animatedIcons,
          weatherIconType,
          temperature: roundTemperature(templow === null ? temperature : Math.max(temperature, templow)),
          temperatureLow: templow === null ? null : roundTemperature(Math.min(temperature, templow)),
          temperatureUnit,
          attributes: attributeItems(i),
        },
      }
    })

    const lastAt = visible[visible.length - 1].at
    const { sunrise, sunset } = hideSunriseSunset || forecastType !== 'hourly'
      ? { sunrise: null, sunset: null }
      : hassService.getNextSunEvents(this.hass, sunEntity, timeZone)
    const sunItems = ([['sunrise', sunrise], ['sunset', sunset]] as const)
      .flatMap(([kind, at]) => at && at.startOf('minute') >= now.startOf('minute') && at <= lastAt ? [{ kind, at }] : [])
      .map(({ kind, at }): { at: DateTime, item: ForecastStripItem } => ({
        at,
        item: {
          label: at.setLocale(locale)
            .toFormat(timePattern),
          condition: kind,
          isNight: false,
          animatedIcon: animatedIcons,
          weatherIconType,
          sunEvent: { kind, label: translationsService.t(locale, kind === 'sunrise' ? 'misc.sunrise' : 'misc.sunset') },
          attributes: attributeItems(null),
        },
      }))

    const items = [...forecastItems, ...sunItems].sort((x, y) => x.at.toMillis() - y.at.toMillis())
      .slice(0, count)

    return html`
      <clock-weather-card-divider></clock-weather-card-divider>
      <div class="strip">
        ${items.map(({ item }) => html`<clock-weather-card-forecast-strip-item .item=${item}></clock-weather-card-forecast-strip-item>`)}
      </div>
    `
  }
}

export default ClockWeatherCardForecastStrip
