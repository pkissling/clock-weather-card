import '@/components/clock-weather-card-divider'
import '@/components/segments/clock-weather-card-entity-segment'

import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html, nothing } from 'lit'
import { state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext, hassContext } from '@/context'
import type { ResolvedConfig, SensorEntityConfig } from '@/types'
import { customElement } from '@/utils/custom-element'

@customElement('clock-weather-card-sensors')
class ClockWeatherCardSensors extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() private hass!: HomeAssistant
  @consume({ context: configContext, subscribe: true }) @state() private config!: ResolvedConfig

  public render(): TemplateResult {
    const { entities, alignment, show_name } = this.config.sensors
    return html`
      <clock-weather-card-divider></clock-weather-card-divider>
      <div class="sensors sensors--${alignment}">
        ${entities.map(item => this.renderItem(item, show_name))}
      </div>
    `
  }

  private renderItem(item: SensorEntityConfig, showName: boolean): TemplateResult {
    const stateObj = this.hass.states[item.entity]
    const name = item.name ?? (stateObj?.attributes.friendly_name as string | undefined) ?? item.entity
    return html`
      <div
        class="sensor"
        role="button"
        tabindex="0"
        title=${name}
        data-entity=${item.entity}
        @click=${(e: Event) => this.openMoreInfo(e, item.entity)}
        @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') this.openMoreInfo(e, item.entity) }}
      >
        <ha-state-icon .hass=${this.hass} .stateObj=${stateObj} .icon=${item.icon}></ha-state-icon>
        <div class="sensor-text">
          <clock-weather-card-entity-segment
            .entityId=${item.entity}
            .attribute=${item.attribute}
            .unit=${item.unit}
          ></clock-weather-card-entity-segment>
          ${showName ? html`<span class="sensor-name">${name}</span>` : nothing}
        </div>
      </div>
    `
  }

  // Opens the sensor's own dialog instead of running the card's tap action.
  private openMoreInfo(e: Event, entityId: string): void {
    e.preventDefault()
    e.stopPropagation()
    this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId } }))
  }
}

export default ClockWeatherCardSensors
