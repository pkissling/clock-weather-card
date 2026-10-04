import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { DEFAULT_DATE_PATTERN } from '@/utils/luxon'

@customElement('clock-weather-card-date-segment')
class ClockWeatherCardDateSegment extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public currentDate!: DateTime
  @property({ attribute: false }) public datePattern?: string

  public render (): TemplateResult {
    return html`<span>${this.currentDate.toFormat(this.datePattern || DEFAULT_DATE_PATTERN)}</span>`
  }
}

export default ClockWeatherCardDateSegment
