import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { errorMessageContext, hassContext } from '@/context'
import type { ClockWeatherCardConfig } from '@/types'

export type ClockWeatherCardErrorSeverity = 'error' | 'warning'

type HuiErrorCard = HTMLElement & {
  setConfig: (c: unknown) => void
  hass?: HomeAssistant
  preview?: boolean
  severity?: ClockWeatherCardErrorSeverity
}

const formatMessage = (message: string): TemplateResult =>
  html`${message.split(/"([^"]*)"/)
    .map((part, i) => i % 2 === 1 ? html`<code>${part}</code>` : part)}`

@customElement('clock-weather-card-error')
class ClockWeatherCardError extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public message!: string
  @consume({ context: hassContext, subscribe: true }) @state() private hass?: HomeAssistant
  @consume({ context: errorMessageContext, subscribe: true }) @state() private errorMessage = false
  @property({ attribute: false }) public config?: ClockWeatherCardConfig
  @property() public severity: ClockWeatherCardErrorSeverity = 'error'

  // The hui-error-card is cached so re-renders (e.g. clock ticks) refresh its
  // config in place instead of swapping the DOM node and losing its state.
  private _errorCard: HuiErrorCard | null = null

  public render(): TemplateResult {
    if (!this._errorCard) {
      this._errorCard = document.createElement('hui-error-card') as HuiErrorCard
    }
    this._errorCard.setConfig({
      type: 'error',
      message: formatMessage(this.message),
      origConfig: this.config,
    })
    this._errorCard.hass = this.hass
    this._errorCard.preview = this.errorMessage
    this._errorCard.severity = this.severity
    return html`${this._errorCard}`
  }
}

export default ClockWeatherCardError
