import '@/components/clock-weather-card-icon'

import type { TemplateResult } from 'lit'
import { html, nothing, svg } from 'lit'
import { property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import type { ForecastStripItem } from '@/types'
import { customElement } from '@/utils/custom-element'
import { MISSING_VALUE } from '@/utils/forecast-attributes'
import { GRAPH_BOTTOM, GRAPH_TOP } from '@/utils/strip-graph'

@customElement('clock-weather-card-forecast-strip-item')
class ClockWeatherCardForecastStripItem extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public item!: ForecastStripItem

  public render(): TemplateResult {
    const { label, condition, isNight, animatedIcon, weatherIconType, temperature, temperatureLow, temperatureUnit, sunEvent, attribute, graph } = this.item
    const attributeClass = weatherIconType === 'monochrome' ? 'attribute attribute--monochrome' : 'attribute'

    return html`
      <span class="time" title=${label}>${label}</span>
      <clock-weather-card-icon
        .weatherState=${condition}
        .isNight=${isNight}
        .animatedIcon=${animatedIcon}
        .weatherIconType=${weatherIconType}
      ></clock-weather-card-icon>
      ${graph ? this._renderGraph(graph) : nothing}
      ${sunEvent
    ? html`<span class="label"><ha-icon icon=${sunEvent.kind === 'sunrise' ? 'mdi:arrow-up' : 'mdi:arrow-down'} title=${sunEvent.label} aria-label=${sunEvent.label}></ha-icon></span>`
    : html`<span class="label">${temperature === null ? MISSING_VALUE : `${temperature}${temperatureUnit}`}</span>`}
      ${temperatureLow === null || temperatureLow === undefined ? nothing : html`<span class="temperature-low">${temperatureLow}${temperatureUnit}</span>`}
      ${attribute
    ? html`<span class=${attributeClass} style=${attribute.color ? `color: ${attribute.color}` : nothing}>${attribute.value !== null ? html`${attribute.icon ? html`<ha-icon icon=${attribute.icon}></ha-icon>` : nothing}<span class="attribute-value">${attribute.value}</span>` : nothing}</span>`
    : nothing}
    `
  }

  // The gradient runs bottom to top over the temperature range, so the line takes the colour of the temperature it passes.
  private _renderGraph({ id, path, stops }: NonNullable<ForecastStripItem['graph']>): TemplateResult {
    return html`
      <span class="graph">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id=${id} gradientUnits="userSpaceOnUse" x1="0" y1=${GRAPH_BOTTOM} x2="0" y2=${GRAPH_TOP}>
              ${stops.map(s => svg`<stop offset="${s.percent}%" stop-color=${s.color}></stop>`)}
            </linearGradient>
          </defs>
          <path class="line" d=${path} fill="none" stroke="url(#${id})" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>
        </svg>
      </span>
    `
  }
}

export default ClockWeatherCardForecastStripItem
