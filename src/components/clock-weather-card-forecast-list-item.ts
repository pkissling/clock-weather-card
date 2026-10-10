import '@/components/clock-weather-card-icon'

import type { TemplateResult } from 'lit'
import { html, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import type { ForecastListItem } from '@/types'

@customElement('clock-weather-card-forecast-list-item')
class ClockWeatherCardForecastListItem extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public item!: ForecastListItem

  public render(): TemplateResult {
    const {
      label, condition, isNight, animatedIcon, weatherIconType,
      lowLabel, highLabel,
      barLowPercent, barHighPercent, gradientStops,
      showCurrentIndicator, currentTempPercent,
    } = this.item

    const gradient = gradientStops
      .map(s => `${s.color} ${s.percent}%`)
      .join(', ')
    const fillStyle = `left: ${barLowPercent}%; right: ${100 - barHighPercent}%; background: linear-gradient(to right, ${gradient});`
    const dotStyle = `--_dot-left: ${currentTempPercent}%;`

    return html`
      <span class="label" title=${label}>${label}</span>
      <clock-weather-card-icon
        .weatherState=${condition}
        .isNight=${isNight}
        .animatedIcon=${animatedIcon}
        .weatherIconType=${weatherIconType}
      ></clock-weather-card-icon>
      <span class="temperature-low">${lowLabel ?? nothing}</span>
      <div class="bar-track">
        <div class="bar-fill" style=${fillStyle}></div>
        ${showCurrentIndicator ? html`<div class="dot" style=${dotStyle}></div>` : nothing}
      </div>
      <span class="temperature-high">${highLabel ?? nothing}</span>
    `
  }
}

export default ClockWeatherCardForecastListItem
