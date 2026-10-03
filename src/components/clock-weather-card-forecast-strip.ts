import '@/components/clock-weather-card-forecast-strip-item'
import '@/components/clock-weather-card-divider'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import AbstractForecastSection from '@/components/abstract-forecast-section'
import hassService from '@/service/hass-service'
import translationsService from '@/service/translations-service'
import type { ForecastStripItem, SectionForecastType } from '@/types'

@customElement('clock-weather-card-forecast-strip')
class ClockWeatherCardForecastStrip extends AbstractForecastSection {
  protected resolveForecastType(): SectionForecastType {
    return this.config.forecastStrip.forecastType
  }

  protected resolveEntityId(): string {
    return this.config.forecastStrip.entity
  }

  protected renderForecast(entityId: string, forecastType: SectionForecastType): TemplateResult {
    const { sunEntity, timeZone, locale } = this.config
    const { count, animatedIcons, weatherIconType, roundTemperatures, hideSunriseSunset } = this.config.forecastStrip
    const temperatureUnit = hassService.getEntityAttributeString(this.hass, entityId, 'temperature_unit')
    const now = this.currentDate

    const visible = this.visibleRows(count)
    if (visible.length === 0) return html``

    const roundTemperature = (t: number): number => roundTemperatures ? Math.round(t) : t

    // Drop the precipitation row entirely if rounded precipitation never above 0%
    const showPrecipitation = visible.some(({ forecast }) => (roundToTens(forecast.precipitation_probability) ?? 0) > 0)

    const forecastItems = visible.map(({ forecast, at, label, isNight }): { at: DateTime, item: ForecastStripItem } => {
      const templow = forecastType === 'daily' ? forecast.templow ?? null : null
      return {
        at,
        item: {
          label,
          condition: forecast.condition,
          isNight,
          animatedIcon: animatedIcons,
          weatherIconType,
          temperature: roundTemperature(templow === null ? forecast.temperature : Math.max(forecast.temperature, templow)),
          temperatureLow: templow === null ? null : roundTemperature(Math.min(forecast.temperature, templow)),
          temperatureUnit,
          precipitationProbability: roundToTens(forecast.precipitation_probability),
          showPrecipitation,
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

    const items = [...forecastItems, ...sunItems].sort((x, y) => x.at.toMillis() - y.at.toMillis())
      .slice(0, count)

    return html`
      <clock-weather-card-divider orientation="horizontal"></clock-weather-card-divider>
      <div class="strip">
        ${items.map(({ item }) => html`<clock-weather-card-forecast-strip-item .item=${item}></clock-weather-card-forecast-strip-item>`)}
      </div>
    `
  }
}

const roundToTens = (value: number | null | undefined): number | null =>
  value === null || value === undefined ? null : Math.round(value / 10) * 10

export default ClockWeatherCardForecastStrip
