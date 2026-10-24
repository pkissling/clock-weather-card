import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { HassEntity } from 'home-assistant-js-websocket/dist/types.js'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext, hassContext } from '@/context'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import type { ResolvedConfig } from '@/types'
import { customElement } from '@/utils/custom-element'
import { formatNumber } from '@/utils/number'
import { toDisplayTemperature } from '@/utils/temperature'

// custom-card-helpers' HomeAssistant predates HA's entity formatters (2023.9).
type HassFormatters = {
  formatEntityState?: (stateObj: HassEntity) => string
  formatEntityAttributeValue?: (stateObj: HassEntity, attribute: string) => string
}

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
    const precision = this.attribute ? null : hassService.getDisplayPrecision(this.hass, this.entityId)
    if (temperature !== null) return this.renderValue(formatNumber(temperature, this.config, precision), temperatureUnit)

    if (this.showUnit && this.unit === undefined && unit === null) {
      logger.warn(`Unit attribute "${this.unitAttribute ?? 'unit_of_measurement'}" not found for entity "${this.entityId}"`)
    }
    const text = this.isNumeric(value, unit, precision) ? formatNumber(Number(value), this.config, precision) : this.formatText(value)
    return this.renderValue(text, unit)
  }

  private renderValue (text: string, unit: string | null): TemplateResult {
    return html`<span>${text}${this.showUnit ? this.unit ?? unit ?? '' : ''}</span>`
  }

  private formatText (value: unknown): string {
    const hass = this.hass as HomeAssistant & HassFormatters
    const stateObj = this.hass.states[this.entityId]
    const text = this.attribute ? hass.formatEntityAttributeValue?.(stateObj, this.attribute) : hass.formatEntityState?.(stateObj)
    return text ?? String(value)
  }

  private isNumeric (value: unknown, unit: string | null, precision: number | null): boolean {
    if (typeof value === 'number') return true
    if (value === '' || Number.isNaN(Number(value))) return false
    // Like HA, a numeric-looking state only counts for numeric entities, so e.g. a zip code isn't grouped.
    const hasStateClass = hassService.getEntityAttribute(this.hass, this.entityId, 'state_class') !== undefined
    return unit !== null || hasStateClass || precision !== null
  }

  private resolveUnit (): string | null {
    const unit = this.unitAttribute
      ? hassService.getEntityAttribute(this.hass, this.entityId, this.unitAttribute)
      : hassService.getEntityUnitOfMeasurement(this.hass, this.entityId)
    return unit === undefined || unit === null || unit === '' ? null : String(unit)
  }
}

export default ClockWeatherCardEntitySegment
