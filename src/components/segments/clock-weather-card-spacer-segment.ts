import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'

@customElement('clock-weather-card-spacer-segment')
class ClockWeatherCardSpacerSegment extends AbstractClockWeatherCardComponent {
  public render (): TemplateResult {
    return html`<span></span>`
  }
}

export default ClockWeatherCardSpacerSegment
