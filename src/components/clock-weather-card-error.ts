import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import type { ClockWeatherCardConfig } from '@/types'

type HuiErrorCard = HTMLElement & {
  setConfig: (c: unknown) => void
  hass?: HomeAssistant
}

@customElement('clock-weather-card-error')
class ClockWeatherCardError extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public message!: string
  @property({ attribute: false }) public hass?: HomeAssistant
  @property({ attribute: false }) public config?: ClockWeatherCardConfig

  // The hui-error-card is cached so re-renders (e.g. clock ticks) refresh its
  // config in place instead of swapping the DOM node and losing its state.
  private _errorCard: HuiErrorCard | null = null

  public render(): TemplateResult {
    if (!this._errorCard) {
      this._errorCard = document.createElement('hui-error-card') as HuiErrorCard
    }
    this._errorCard.setConfig({
      type: 'error',
      error: this.message,
      message: this.message,
      origConfig: this.config,
    })
    this._errorCard.hass = this.hass
    return html`${this._errorCard}`
  }
}

export default ClockWeatherCardError
