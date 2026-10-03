import '@/components/segments/clock-weather-card-icon-segment'

import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext, hassContext } from '@/context'
import hassService from '@/service/hass-service'
import iconsService from '@/service/icons-service'
import type { ResolvedConfig } from '@/types'

@customElement('clock-weather-card-weather-icon-segment')
class ClockWeatherCardWeatherIconSegment extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() private hass!: HomeAssistant
  @consume({ context: configContext, subscribe: true }) @state() private config!: ResolvedConfig
  @property() public entityId?: string

  public render (): TemplateResult {
    const weatherState = hassService.getEntityState(this.hass, this.entityId ?? this.config.entity)
    if (!weatherState) return html``
    const isNight = hassService.isNight(this.hass, this.config.sunEntity)
    const icon = iconsService.getWeatherMdiIcon(weatherState, isNight)
    return html`<clock-weather-card-icon-segment .icon=${icon}></clock-weather-card-icon-segment>`
  }
}

export default ClockWeatherCardWeatherIconSegment
