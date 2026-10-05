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

@customElement('clock-weather-card-weather-segment')
class ClockWeatherCardWeatherSegment extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() private hass!: HomeAssistant
  @consume({ context: configContext, subscribe: true }) @state() private config!: ResolvedConfig
  @property() public attribute?: string
  @property({ type: Boolean }) public showUnit = true
  @property() public unit?: string

  public render (): TemplateResult {
    const { entity, locale, temperatureUnit } = this.config
    if (this.attribute) {
      if (hassService.isWeatherTemperatureAttribute(this.attribute)) {
        const temperature = hassService.getWeatherTemperature(this.hass, entity, this.attribute, temperatureUnit)
        if (temperature === null) return html``
        return html`<span>${temperature}${this.showUnit ? this.unit ?? temperatureUnit : ''}</span>`
      }
      const value = hassService.getEntityAttribute(this.hass, entity, this.attribute)
      if (value === undefined) logger.warn(`Attribute "${this.attribute}" not found on weather entity "${entity}"`)
      if (value === undefined || value === null) return html``
      const unit = this.showUnit
        ? this.unit ?? hassService.getWeatherAttributeUnit(this.hass, entity, this.attribute) ?? ''
        : ''
      return html`<span>${value}${unit}</span>`
    }

    const state = hassService.getEntityState(this.hass, entity)
    if (!state) return html``
    const translated = translationsService.t(locale, `weather.${state}`)
    return html`<span>${translated}</span>`
  }
}

export default ClockWeatherCardWeatherSegment
