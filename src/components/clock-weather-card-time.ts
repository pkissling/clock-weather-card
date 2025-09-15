import type { CSSResultGroup, TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'

@customElement('clock-weather-card-time')
class ClockWeatherCardTime extends AbstractClockWeatherCardComponent {
  @state() private date = new Date()
  @query('.time') private _timeEl!: HTMLSpanElement
  private _intervalId: number | null = null
  private _timeoutId: number | null = null
  private _resizeObserver: ResizeObserver | null = null

  protected getComponentName(): String {
    return 'clock-weather-card-time'
  }

  public render (): TemplateResult {
    return html`<span class="time">${this.date
      .toISOString()
      .substring(11, 19)}</span>`
  }

  public connectedCallback(): void {
    super.connectedCallback()
    this._startClock()
    this._resizeObserver = new ResizeObserver(() => this._fitText())
    this._resizeObserver.observe(this)
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    this._stopClock()
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
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
    // Recompute after content change
    this.updateComplete.then(() => this._fitText())
  }

  protected firstUpdated(): void {
    this._fitText()
  }

  private _fitText(): void {
    const hostWidth = this.clientWidth
    const hostHeight = this.clientHeight
    const el = this._timeEl
    if (!el || hostWidth === 0 || hostHeight === 0) return

    let lo = 6
    let hi = Math.max(12, Math.min(hostWidth, hostHeight) * 2)

    const fits = (size: number): boolean => {
      el.style.fontSize = `${size}px`
      const r = el.getBoundingClientRect()
      return r.width <= hostWidth && r.height <= hostHeight
    }

    // Binary search the tightest fit
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2
      if (fits(mid)) lo = mid
      else hi = mid
    }
    el.style.fontSize = `${Math.floor(lo)}px`
  }
}
