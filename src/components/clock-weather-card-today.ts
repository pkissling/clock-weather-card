/* eslint-disable lit/no-invalid-html */
import type { TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { html } from 'lit/static-html.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import ClockWeatherCardIcon from '@/components/clock-weather-card-icon'
import ClockWeatherCardTime from '@/components/clock-weather-card-time'
import type { WeatherIconType } from '@/types'

@customElement(ClockWeatherCardToday.customElementName)
class ClockWeatherCardToday extends AbstractClockWeatherCardComponent {
  protected static override getCustomElementName(): string {
    return 'clock-weather-card-today'
  }

  @property({ attribute: false }) public weatherState!: string
  @property({ attribute: false }) public isNight!: boolean
  @property({ attribute: false }) public animatedIcon!: boolean
  @property({ attribute: false }) public weatherIconType!: WeatherIconType

  public render (): TemplateResult {
    return html`
      <${ClockWeatherCardIcon.tag}
        .weatherState=${this.weatherState}
        .isNight=${this.isNight}
        .animatedIcon=${this.animatedIcon}
        .weatherIconType=${this.weatherIconType}
      ></${ClockWeatherCardIcon.tag}>
      <${ClockWeatherCardTime.tag}></${ClockWeatherCardTime.tag}>
    `
  }
}

export default ClockWeatherCardToday
