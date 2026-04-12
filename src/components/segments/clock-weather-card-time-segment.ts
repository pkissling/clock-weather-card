import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { DEFAULT_TIME_PATTERN } from '@/constants'
import hassService from '@/service/hass-service'

@customElement('clock-weather-card-time-segment')
class ClockWeatherCardTimeSegment extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public currentDate!: Date
  @property() public pattern = DEFAULT_TIME_PATTERN

  public render (): TemplateResult {
    const locale = hassService.getLocale(this.hass)
    const formatted = DateTime.fromJSDate(this.currentDate)
      .setLocale(locale)
      .toFormat(this.pattern)
    return html`<span>${formatted}</span>`
  }
}

export default ClockWeatherCardTimeSegment
