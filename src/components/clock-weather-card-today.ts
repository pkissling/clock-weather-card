import '@/components/clock-weather-card-icon'
import '@/components/clock-weather-card-today-details'

import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import configService from '@/service/config-service'
import hassService from '@/service/hass-service'
import type { ClockWeatherCardConfig } from '@/types'

@customElement('clock-weather-card-today')
class ClockWeatherCardToday extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: ClockWeatherCardConfig
  @property({ attribute: false }) public currentDate!: DateTime

  public render (): TemplateResult {
    const weatherState = hassService.getWeatherState(this.hass.states, configService.getEntity(this.config))
    const isNight = hassService.isNight(this.hass.states, configService.getSunEntity(this.config))

    return html`
      <clock-weather-card-icon
        .weatherState=${weatherState}
        .isNight=${isNight}
        .animatedIcon=${configService.getAnimatedIcon(this.config)}
        .weatherIconType=${configService.getWeatherIconType(this.config)}
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
