import '@/components/clock-weather-card-icon'

import type { TemplateResult } from 'lit'
import { html, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import type { DailyForecastItem } from '@/types'

@customElement('clock-weather-card-daily-forecast-item')
class ClockWeatherCardDailyForecastItem extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public item!: DailyForecastItem

  public render(): TemplateResult {
    const {
      label, condition, isNight, animatedIcon, weatherIconType,
      temperatureLow, temperatureHigh, temperatureUnit,
      barLowPercent, barHighPercent, gradientStops,
      showCurrentIndicator, currentTempPercent,
    } = this.item

    const gradient = gradientStops
      .map(s => `${s.color} ${s.percent}%`)
      .join(', ')
    const fillStyle = `left: ${barLowPercent}%; right: ${100 - barHighPercent}%; background: linear-gradient(to right, ${gradient});`
    const dotStyle = `left: ${currentTempPercent}%;`

    return html`
      <span class="day-label">${label}</span>
      <clock-weather-card-icon
        .weatherState=${condition}
        .isNight=${isNight}
        .animatedIcon=${animatedIcon}
        .weatherIconType=${weatherIconType}
      ></clock-weather-card-icon>
      <span class="temperature-low">${temperatureLow}${temperatureUnit}</span>
      <div class="bar-track">
        <div class="bar-fill" style=${fillStyle}></div>
        ${showCurrentIndicator ? html`<div class="dot" style=${dotStyle}></div>` : nothing}
      </div>
      <span class="temperature-high">${temperatureHigh}${temperatureUnit}</span>
    `
  }
}

export default ClockWeatherCardDailyForecastItem
