import '@/components/clock-weather-card-icon'

import type { TemplateResult } from 'lit'
import { html, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import type { ForecastStripItem } from '@/types'

@customElement('clock-weather-card-forecast-strip-item')
class ClockWeatherCardForecastStripItem extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public item!: ForecastStripItem

  public render(): TemplateResult {
    const { label, condition, isNight, animatedIcon, weatherIconType, temperature, temperatureLow, temperatureUnit, sunEvent, precipitationProbability, showPrecipitation } = this.item
    const precipClass = weatherIconType === 'monochrome' ? 'precipitation precipitation--monochrome' : 'precipitation'

    return html`
      <span class="time">${label}</span>
      <clock-weather-card-icon
        .weatherState=${condition}
        .isNight=${isNight}
        .animatedIcon=${animatedIcon}
        .weatherIconType=${weatherIconType}
      ></clock-weather-card-icon>
      ${sunEvent
    ? html`<span class="label"><ha-icon icon=${sunEvent.kind === 'sunrise' ? 'mdi:arrow-up' : 'mdi:arrow-down'} title=${sunEvent.label} aria-label=${sunEvent.label}></ha-icon></span>`
    : html`<span class="label">${temperature}${temperatureUnit}</span>`}
      ${temperatureLow === null || temperatureLow === undefined ? nothing : html`<span class="temperature-low">${temperatureLow}${temperatureUnit}</span>`}
      ${showPrecipitation
    ? html`<span class=${precipClass}>${precipitationProbability !== null ? html`<ha-icon icon="mdi:water"></ha-icon>${precipitationProbability}%` : nothing}</span>`
    : nothing}
    `
  }
}

export default ClockWeatherCardForecastStripItem
