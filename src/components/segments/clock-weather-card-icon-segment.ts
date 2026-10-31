import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { hassContext } from '@/context'
import { customElement } from '@/utils/custom-element'

@customElement('clock-weather-card-icon-segment')
class ClockWeatherCardIconSegment extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() private hass!: HomeAssistant
  @property() public icon?: string
  @property() public entityId?: string

  public render (): TemplateResult {
    if (this.entityId) {
      // ha-state-icon resolves the entity's icon like HA does (attribute, registry, state-based translations).
      return html`<ha-state-icon .hass=${this.hass} .stateObj=${this.hass.states[this.entityId]} style="--mdc-icon-size: 1em"></ha-state-icon>`
    }
    return html`<ha-icon icon="${this.icon}" style="--mdc-icon-size: 1em"></ha-icon>`
  }
}

export default ClockWeatherCardIconSegment
