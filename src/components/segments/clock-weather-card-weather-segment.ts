import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import hassService from '@/service/hass-service'
import translationsService from '@/service/translations-service'

@customElement('clock-weather-card-weather-segment')
class ClockWeatherCardWeatherSegment extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property() public entity!: string
  @property() public attribute?: string
  @property({ type: Boolean }) public showUnit = true

  public render (): TemplateResult {
    const locale = hassService.getLocale(this.hass)

    if (this.attribute) {
      const value = hassService.getEntityAttribute(this.hass.states, this.entity, this.attribute)
      if (value === undefined || value === null) return html``
      const unit = this.showUnit
        ? hassService.getEntityAttribute(this.hass.states, this.entity, `${this.attribute}_unit`) ?? ''
        : ''
      return html`<span>${value}${unit}</span>`
    }

    const state = hassService.getEntityState(this.hass.states, this.entity)
    if (!state) return html``
    const translated = translationsService.t(locale, `weather.${state}`)
    return html`<span>${translated}</span>`
  }
}

export default ClockWeatherCardWeatherSegment
