import '@/components/clock-weather-card-today-details-row'

import { consume } from '@lit/context'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext } from '@/context'
import type { ResolvedConfig } from '@/types'

@customElement('clock-weather-card-today-details')
class ClockWeatherCardTodayDetails extends AbstractClockWeatherCardComponent {
  @consume({ context: configContext, subscribe: true }) @state() private config!: ResolvedConfig
  @property({ attribute: false }) public currentDate!: DateTime

  public render (): TemplateResult {
    return html`${this.config.header.rows
      .map(rowConfig => html`
        <clock-weather-card-today-details-row
          style="font-size: ${rowConfig.font_size ?? ''}"
          .rowConfig=${rowConfig}
          .currentDate=${this.currentDate}
        ></clock-weather-card-today-details-row>
      `)}`
  }
}

export default ClockWeatherCardTodayDetails
