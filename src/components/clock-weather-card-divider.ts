import type { TemplateResult } from 'lit'
import { html } from 'lit'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { customElement } from '@/utils/custom-element'

@customElement('clock-weather-card-divider')
class ClockWeatherCardDivider extends AbstractClockWeatherCardComponent {
  public render(): TemplateResult {
    return html``
  }
}

export default ClockWeatherCardDivider
