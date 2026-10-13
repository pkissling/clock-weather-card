import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext, hassContext } from '@/context'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import type { ResolvedConfig } from '@/types'
import { customElement } from '@/utils/custom-element'
import { toDisplayTemperature } from '@/utils/temperature'

@customElement('clock-weather-card-entity-segment')
class ClockWeatherCardEntitySegment extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() private hass!: HomeAssistant
  @consume({ context: configContext, subscribe: true }) @state() private config!: ResolvedConfig
  @property() public entityId!: string
  @property() public attribute?: string
  @property({ type: Boolean }) public showUnit = true
  @property() public unit?: string
  @property() public unitAttribute?: string

  public render (): TemplateResult {
    const value = this.attribute
      ? hassService.getEntityAttribute(this.hass, this.entityId, this.attribute)
      : hassService.getEntityState(this.hass, this.entityId)
    if (value === undefined || value === null) return html``

    const unit = this.resolveUnit()
    const { temperatureUnit } = this.config
    const temperature = toDisplayTemperature(value, unit, temperatureUnit)
    if (temperature !== null) {
      const displayUnit = this.showUnit ? this.unit ?? temperatureUnit : ''
      return html`<span>${this.format(temperature)}${displayUnit}</span>`
    }

    if (this.showUnit && this.unit === undefined && unit === null) {
      logger.warn(`Unit attribute "${this.unitAttribute ?? 'unit_of_measurement'}" not found for entity "${this.entityId}"`)
    }
    const displayUnit = this.showUnit ? this.unit ?? unit ?? '' : ''
    return html`<span>${this.format(value)}${displayUnit}</span>`
  }

  private format (value: unknown): unknown {
    return this.attribute ? value : hassService.formatWithDisplayPrecision(this.hass, this.entityId, value)
  }

  private resolveUnit (): string | null {
    const unit = this.unitAttribute
      ? hassService.getEntityAttribute(this.hass, this.entityId, this.unitAttribute)
      : hassService.getEntityUnitOfMeasurement(this.hass, this.entityId)
    return unit === undefined || unit === null || unit === '' ? null : String(unit)
  }
}

export default ClockWeatherCardEntitySegment
