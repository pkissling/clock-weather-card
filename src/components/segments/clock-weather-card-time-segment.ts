import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'

@customElement('clock-weather-card-time-segment')
class ClockWeatherCardTimeSegment extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public currentDate!: DateTime
  @property({ attribute: false }) public timePattern?: string

  public render (): TemplateResult {
    const formatted = this.timePattern
      ? this.currentDate.toFormat(this.timePattern)
      : this.currentDate.toLocaleString(DateTime.TIME_SIMPLE)
    return html`<span>${formatted}</span>`
  }
}

export default ClockWeatherCardTimeSegment
