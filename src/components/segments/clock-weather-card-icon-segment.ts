import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { customElement } from '@/utils/custom-element'

@customElement('clock-weather-card-icon-segment')
class ClockWeatherCardIconSegment extends AbstractClockWeatherCardComponent {
  @property() public icon!: string

  public render (): TemplateResult {
    return html`<ha-icon icon="${this.icon}" style="--mdc-icon-size: 1em"></ha-icon>`
  }
}

export default ClockWeatherCardIconSegment
