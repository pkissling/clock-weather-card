import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'

@customElement(ClockWeatherCardTime.customElementName)
class ClockWeatherCardTime extends AbstractClockWeatherCardComponent {
  protected static override getCustomElementName(): string {
    return 'clock-weather-card-time'
  }

  @state() private date = new Date()
  private _intervalId: number | null = null
  private _timeoutId: number | null = null

  public render (): TemplateResult {
    return html`<span class="time">${this.date
      .toISOString()
      .substring(11, 19)}</span>`
  }

  public connectedCallback(): void {
    super.connectedCallback()
    this._startClock()
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    this._stopClock()
  }

  private _startClock(): void {
    const msToNextSecond = 1000 - (Date.now() % 1000)
    this._timeoutId = window.setTimeout(() => {
      this._tick()
      this._intervalId = window.setInterval(() => this._tick(), 1000)
    }, msToNextSecond)
  }

  private _stopClock(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId)
      this._timeoutId = null
    }
    if (this._intervalId !== null) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
  }

  private _tick(): void {
    this.date = new Date()
  }
}

export default ClockWeatherCardTime
