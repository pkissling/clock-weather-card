import '@/components/clock-weather-card-icon'
import '@/components/clock-weather-card-header-details'

import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html, nothing } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ref } from 'lit/directives/ref.js'
import type { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext, hassContext } from '@/context'
import hassService from '@/service/hass-service'
import type { ResolvedConfig } from '@/types'

@customElement('clock-weather-card-header')
class ClockWeatherCardHeader extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() private hass!: HomeAssistant
  @consume({ context: configContext, subscribe: true }) @state() private config!: ResolvedConfig
  @property({ attribute: false }) public currentDate!: DateTime
  private resizeObserver = new ResizeObserver(([entry]) => {
    this.style.setProperty('--cwc-header-rows-height', `${(entry.target as HTMLElement).offsetHeight}px`)
  })

  private observeDetails = (details?: Element): void => {
    this.resizeObserver.disconnect()
    if (details) this.resizeObserver.observe(details)
  }

  public render (): TemplateResult {
    const weatherState = hassService.getEntityState(this.hass, this.config.entity)
    const isNight = hassService.isNight(this.hass, this.config.sunEntity)

    const { weatherIconSize } = this.config.header

    return html`
      <clock-weather-card-icon
        style=${weatherIconSize ? `--cwc-header-icon-size: ${weatherIconSize}` : nothing}
        .weatherState=${weatherState}
        .isNight=${isNight}
        .animatedIcon=${this.config.header.animatedIcons}
        .weatherIconType=${this.config.header.weatherIconType}
      ></clock-weather-card-icon>
      <clock-weather-card-header-details ${ref(this.observeDetails)} .currentDate=${this.currentDate}></clock-weather-card-header-details>
    `
  }
}

export default ClockWeatherCardHeader
