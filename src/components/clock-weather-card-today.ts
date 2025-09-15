import '@/components/clock-weather-card-icon'
import '@/components/clock-weather-card-time'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import type { WeatherIconType } from '@/types'

@customElement('clock-weather-card-today')
class ClockWeatherCardToday extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public weatherState!: string
  @property({ attribute: false }) public isNight!: boolean
  @property({ attribute: false }) public animatedIcon!: boolean
  @property({ attribute: false }) public weatherIconType!: WeatherIconType

  public render (): TemplateResult {
    return html`
      <clock-weather-card-icon
        .weatherState=${this.weatherState}
        .isNight=${this.isNight}
        .animatedIcon=${this.animatedIcon}
        .weatherIconType=${this.weatherIconType}
      ></clock-weather-card-icon>
      <clock-weather-card-time></clock-weather-card-time>
    `
  }

  protected getComponentName(): String {
    return 'clock-weather-card-today'
  }
}
