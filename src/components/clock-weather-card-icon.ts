import type { PropertyValues, TemplateResult } from 'lit'
import { html, nothing } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import iconsService from '@/service/icons-service'
import logger from '@/service/logger'
import type { WeatherIconType } from '@/types'

@customElement('clock-weather-card-icon')
class ClockWeatherCardIcon extends AbstractClockWeatherCardComponent {
  @property() public weatherState!: string
  @property() public isNight!: boolean
  @property() public animatedIcon!: boolean
  @property() public weatherIconType!: WeatherIconType
  @state() private _src?: string
  // Reflected so e2e tests can wait until the current icon has actually loaded.
  @property({ type: Boolean, reflect: true, attribute: 'data-settled' }) private _settled = false

  public render(): TemplateResult {
    return html`<img src="${this._src ?? nothing}" @load=${this._onImageDone} @error=${this._onImageDone} />`
  }

  public willUpdate(changed: PropertyValues): void {
    if (
      !changed.has('weatherState') &&
      !changed.has('isNight') &&
      !changed.has('animatedIcon') &&
      !changed.has('weatherIconType')
    ) return

    const { weatherIconType, weatherState, isNight, animatedIcon } = this
    const src = iconsService.getWeatherIcon(weatherIconType, animatedIcon, weatherState, isNight)
    if (!src) {
      logger.warn(`No "${weatherIconType}" icon for weather state "${weatherState}", keeping the previous icon`)
      this._settled = true
    } else if (src !== this._src) {
      this._src = src
      this._settled = false
    }
  }

  private _onImageDone(): void {
    this._settled = true
  }
}

export default ClockWeatherCardIcon
