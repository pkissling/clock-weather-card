import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext, hassContext } from '@/context'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import type { ResolvedConfig } from '@/types'
import { convertTemperature, isTemperatureUnit } from '@/utils/temperature'

@customElement('clock-weather-card-entity-segment')
class ClockWeatherCardEntitySegment extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() private hass!: HomeAssistant
  @consume({ context: configContext, subscribe: true }) @state() private config!: ResolvedConfig
  @property() public entityId!: string
  @property() public attribute?: string
  @property({ type: Boolean }) public showUnit = true
  @property() public unitAttribute?: string

  public render (): TemplateResult {
    const value = this.attribute
      ? hassService.getEntityAttribute(this.hass, this.entityId, this.attribute)
      : hassService.getEntityState(this.hass, this.entityId)
    if (value === undefined || value === null) return html``

    const unit = this.resolveUnit()
    const numeric = Number(value)
    if (isTemperatureUnit(unit) && value !== '' && Number.isFinite(numeric)) {
      const { temperatureUnit } = this.config
      return html`<span>${convertTemperature(numeric, unit, temperatureUnit)}${this.showUnit ? temperatureUnit : ''}</span>`
    }

    if (this.showUnit && unit === null) {
      logger.warn(`Unit attribute "${this.unitAttribute ?? 'unit_of_measurement'}" not found for entity "${this.entityId}"`)
    }
    return html`<span>${value}${this.showUnit ? unit ?? '' : ''}</span>`
  }

  private resolveUnit (): string | null {
    const unit = this.unitAttribute
      ? hassService.getEntityAttribute(this.hass, this.entityId, this.unitAttribute)
      : hassService.getEntityUnitOfMeasurement(this.hass, this.entityId)
    return unit === undefined || unit === null || unit === '' ? null : String(unit)
  }
}

export default ClockWeatherCardEntitySegment
