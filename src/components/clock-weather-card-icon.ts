import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import iconsService from '@/service/icons-service'
import type { WeatherIconType } from '@/types'

@customElement(ClockWeatherCardIcon.customElementName)
class ClockWeatherCardIcon extends AbstractClockWeatherCardComponent {
  protected static override getCustomElementName(): string {
    return 'clock-weather-card-icon'
  }

  @property() public weatherState!: string
  @property() public isNight!: boolean
  @property() public animatedIcon!: boolean
  @property() public weatherIconType!: WeatherIconType

  public render(): TemplateResult {
    return html`
      <img src="${this._src()}" />
    `
  }

  private _src(): string {
    return iconsService.getWeatherIcon(this.weatherIconType, this.animatedIcon, this.weatherState, this.isNight)
  }
}

export default ClockWeatherCardIcon
