import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'

@customElement('clock-weather-card-divider')
class ClockWeatherCardDivider extends AbstractClockWeatherCardComponent {
  @property({ reflect: true }) public orientation: 'horizontal' | 'vertical' = 'horizontal'

  public render(): TemplateResult {
    return html``
  }
}

export default ClockWeatherCardDivider
