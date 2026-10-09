import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext, hassContext } from '@/context'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import translationsService from '@/service/translations-service'
import type { ResolvedConfig } from '@/types'
import { toDisplayTemperature } from '@/utils/temperature'

@customElement('clock-weather-card-weather-segment')
class ClockWeatherCardWeatherSegment extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() private hass!: HomeAssistant
  @consume({ context: configContext, subscribe: true }) @state() private config!: ResolvedConfig
  @property() public attribute?: string
  @property({ type: Boolean }) public showUnit = true
  @property() public unit?: string
  @property() public unitAttribute?: string

  public render (): TemplateResult {
    const { entity, locale, temperatureUnit } = this.config
    if (this.attribute) {
      if (!this.unitAttribute && hassService.isWeatherTemperatureAttribute(this.attribute)) {
        const temperature = hassService.getWeatherTemperature(this.hass, entity, this.attribute, temperatureUnit)
        if (temperature === null) return html``
        return html`<span>${temperature}${this.showUnit ? this.unit ?? temperatureUnit : ''}</span>`
      }
      const value = hassService.getEntityAttribute(this.hass, entity, this.attribute)
      if (value === undefined) logger.warn(`Attribute "${this.attribute}" not found on weather entity "${entity}"`)
      if (value === undefined || value === null) return html``
      const unit = this.unitAttribute
        ? hassService.getEntityAttributeString(this.hass, entity, this.unitAttribute)
        : hassService.getWeatherAttributeUnit(this.hass, entity, this.attribute)
      const temperature = toDisplayTemperature(value, unit, temperatureUnit)
      if (temperature !== null) return html`<span>${temperature}${this.showUnit ? this.unit ?? temperatureUnit : ''}</span>`
      return html`<span>${value}${this.showUnit ? this.unit ?? unit ?? '' : ''}</span>`
    }

    const state = hassService.getEntityState(this.hass, entity)
    if (!state) return html``
    const translated = translationsService.t(locale, `weather.${state}`)
    return html`<span>${translated}</span>`
  }
}

export default ClockWeatherCardWeatherSegment
