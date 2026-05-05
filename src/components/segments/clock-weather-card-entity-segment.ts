import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'

@customElement('clock-weather-card-entity-segment')
class ClockWeatherCardEntitySegment extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property() public entityId!: string
  @property() public attribute?: string
  @property({ type: Boolean }) public showUnit = true
  @property() public unitAttribute?: string

  public render (): TemplateResult {
    if (this.attribute) {
      const value = hassService.getEntityAttribute(this.hass, this.entityId, this.attribute)
      if (value === undefined || value === null) return html``
      const unit = this.showUnit
        ? this.resolveUnit()
        : ''
      return html`<span>${value}${unit}</span>`
    }

    const state = hassService.getEntityState(this.hass, this.entityId)
    if (!state) return html``
    const unit = this.showUnit
      ? this.resolveUnit()
      : ''
    return html`<span>${state}${unit}</span>`
  }

  private resolveUnit (): string {
    if (this.unitAttribute) {
      const unit = hassService.getEntityAttribute(this.hass, this.entityId, this.unitAttribute)
      if (unit === undefined || unit === null) {
        logger.warn(`Unit attribute "${this.unitAttribute}" not found for entity "${this.entityId}"`)
        return ''
      }
      return String(unit)
    }
    const unit = hassService.getEntityUnitOfMeasurement(this.hass, this.entityId)
    if (!unit) {
      logger.warn(`Unit attribute "unit_of_measurement" not found for entity "${this.entityId}"`)
      return ''
    }
    return unit
  }
}

export default ClockWeatherCardEntitySegment
