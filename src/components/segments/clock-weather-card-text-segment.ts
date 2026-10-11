import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'

@customElement('clock-weather-card-text-segment')
class ClockWeatherCardTextSegment extends AbstractClockWeatherCardComponent {
  @property() public text!: string

  public render (): TemplateResult {
    return html`<span>${this.text}</span>`
  }
}

export default ClockWeatherCardTextSegment
