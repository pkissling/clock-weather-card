import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { DEFAULT_TIME_PATTERN } from '@/utils/luxon'

@customElement('clock-weather-card-time-segment')
class ClockWeatherCardTimeSegment extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public currentDate!: DateTime
  @property({ attribute: false }) public timePattern?: string

  public render (): TemplateResult {
    return html`<span>${this.currentDate.toFormat(this.timePattern || DEFAULT_TIME_PATTERN)}</span>`
  }
}

export default ClockWeatherCardTimeSegment
