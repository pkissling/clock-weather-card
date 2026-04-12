import '@/components/clock-weather-card-today-details-row'

import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import type { MergedClockWeatherCardConfig } from '@/types'

@customElement('clock-weather-card-today-details')
class ClockWeatherCardTodayDetails extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: MergedClockWeatherCardConfig
  @property({ attribute: false }) public currentDate!: Date

  public render (): TemplateResult {
    return html`${this.config.rows
      .map(rowConfig => html`
        <clock-weather-card-today-details-row
          style="font-size: ${rowConfig.font_size ?? ''}"
          .hass=${this.hass}
          .config=${this.config}
          .rowConfig=${rowConfig}
          .currentDate=${this.currentDate}
        ></clock-weather-card-today-details-row>
      `)}`
  }
}

export default ClockWeatherCardTodayDetails
