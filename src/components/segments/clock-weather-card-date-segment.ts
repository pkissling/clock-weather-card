import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'

@customElement('clock-weather-card-date-segment')
class ClockWeatherCardDateSegment extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public currentDate!: DateTime
  @property({ attribute: false }) public datePattern?: string

  public render (): TemplateResult {
    const formatted = this.datePattern
      ? this.currentDate.toFormat(this.datePattern)
      : this.currentDate.toLocaleString(DateTime.DATE_FULL)
    return html`<span>${formatted}</span>`
  }
}

export default ClockWeatherCardDateSegment
