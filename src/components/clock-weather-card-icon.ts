import { consume } from '@lit/context'
import type { PropertyValues, TemplateResult } from 'lit'
import { html, nothing } from 'lit'
import { property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { configContext } from '@/context'
import iconsService from '@/service/icons-service'
import logger from '@/service/logger'
import translationsService from '@/service/translations-service'
import type { ResolvedConfig, WeatherIconType } from '@/types'
import { customElement } from '@/utils/custom-element'

@customElement('clock-weather-card-icon')
class ClockWeatherCardIcon extends AbstractClockWeatherCardComponent {
  @property() public weatherState!: string
  @property() public isNight!: boolean
  @property() public animatedIcon!: boolean
  @property() public weatherIconType!: WeatherIconType
  @consume({ context: configContext, subscribe: true }) @state() private config!: ResolvedConfig
  @state() private _src?: string
  // Reflected so e2e tests can wait until the current icon has actually loaded.
  @property({ type: Boolean, reflect: true, attribute: 'data-settled' }) private _settled = false

  public render(): TemplateResult {
    const key = `weather.${this.weatherState === 'sunny' && this.isNight ? 'clear-night' : this.weatherState}`
    const alt = translationsService.has(key) ? translationsService.t(this.config.locale, key) : ''
    return html`<img src="${this._src ?? nothing}" alt=${alt} @load=${this._onImageDone} @error=${this._onImageDone} />`
  }

  public willUpdate(changed: PropertyValues): void {
    if (
      !changed.has('weatherState') &&
      !changed.has('isNight') &&
      !changed.has('animatedIcon') &&
      !changed.has('weatherIconType')
    ) return

    const { weatherIconType, weatherState, isNight, animatedIcon } = this
    const animated = animatedIcon && !matchMedia('(prefers-reduced-motion: reduce)').matches
    const src = iconsService.getWeatherIcon(weatherIconType, animated, weatherState, isNight)
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
