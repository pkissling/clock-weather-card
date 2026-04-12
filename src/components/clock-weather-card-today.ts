import '@/components/clock-weather-card-icon'
import '@/components/clock-weather-card-today-details'

import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import hassService from '@/service/hass-service'
import type { MergedClockWeatherCardConfig } from '@/types'

@customElement('clock-weather-card-today')
class ClockWeatherCardToday extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: MergedClockWeatherCardConfig
  @property({ attribute: false }) public currentDate!: Date

  public render (): TemplateResult {
    const weatherState = hassService.getWeatherState(this.hass.states, this.config.entity)
    const isNight = hassService.isNight(this.hass.states, this.config.sun_entity)

    return html`
      <clock-weather-card-icon
        .weatherState=${weatherState}
        .isNight=${isNight}
        .weatherIconType=${this.config.weather_icon_type}
      ></clock-weather-card-icon>
      <clock-weather-card-today-details
        .hass=${this.hass}
        .config=${this.config}
        .currentDate=${this.currentDate}
      ></clock-weather-card-today-details>
    `
  }
}

export default ClockWeatherCardToday
