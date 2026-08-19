import type { PropertyValues, TemplateResult } from 'lit'
import { html, nothing } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import iconsService from '@/service/icons-service'
import type { WeatherIconType } from '@/types'

@customElement('clock-weather-card-icon')
class ClockWeatherCardIcon extends AbstractClockWeatherCardComponent {
  @property() public weatherState!: string
  @property() public isNight!: boolean
  @property() public animatedIcon!: boolean
  @property() public weatherIconType!: WeatherIconType
  @state() private _src?: string
  // Reflected so e2e tests can wait for the final (static or animated) src.
  @property({ type: Boolean, reflect: true, attribute: 'data-settled' }) private _settled = false
  private _loadId = 0

  public render(): TemplateResult {
    return html`<img src="${this._src ?? nothing}" />`
  }

  public willUpdate(changed: PropertyValues): void {
    if (
      changed.has('weatherState') ||
      changed.has('isNight') ||
      changed.has('animatedIcon') ||
      changed.has('weatherIconType')
    ) {
      void this._loadIcon()
    }
  }

  private async _loadIcon(): Promise<void> {
    // Bump per-load id so a stale resolution from a previous prop set
    // can't overwrite the current icon.
    const id = ++this._loadId
    this._settled = false
    const { weatherIconType, weatherState, isNight, animatedIcon } = this

    try {
      const staticUrl = await iconsService.getWeatherIcon(weatherIconType, false, weatherState, isNight)
      if (id === this._loadId) this._src = staticUrl
    } catch {
      // fall through to animated attempt; if both fail we keep the previous src
    }

    if (animatedIcon) {
      try {
        const animatedUrl = await iconsService.getWeatherIcon(weatherIconType, true, weatherState, isNight)
        if (id === this._loadId) this._src = animatedUrl
      } catch {
        // keep static fallback
      }
    }

    if (id === this._loadId) this._settled = true
  }
}

export default ClockWeatherCardIcon
