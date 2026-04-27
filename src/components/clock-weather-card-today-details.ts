import '@/components/clock-weather-card-today-details-row'

import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import configService from '@/service/config-service'
import type { ClockWeatherCardConfig } from '@/types'

@customElement('clock-weather-card-today-details')
class ClockWeatherCardTodayDetails extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: ClockWeatherCardConfig
  @property({ attribute: false }) public currentDate!: DateTime

  public render (): TemplateResult {
    const entity = configService.getEntity(this.config)
    return html`${configService.getRows(this.config)
      .map(rowConfig => html`
        <clock-weather-card-today-details-row
          style="font-size: ${rowConfig.font_size ?? ''}"
          .hass=${this.hass}
          .entity=${entity}
          .rowConfig=${rowConfig}
          .currentDate=${this.currentDate}
        ></clock-weather-card-today-details-row>
      `)}`
  }
}

export default ClockWeatherCardTodayDetails
