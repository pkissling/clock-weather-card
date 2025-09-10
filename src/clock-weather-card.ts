import { html, LitElement, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import translationsService from '@/service/translations-service'
import { generateCustomElementName, isDev } from '@/utils/development'

// eslint-disable-next-line no-restricted-imports
import { version } from '../package.json'
import { HomeAssistant } from 'custom-card-helpers'
import { ClockWeatherCardConfig, Weather } from './types'
import animatedFillFogNight from './icons/fill/svg/fog-night.svg'



const customElementName = generateCustomElementName()

// This puts your card into the UI card picker dialog
window.customCards = window.customCards || []
window.customCards.push({
  type: customElementName,
  name: 'Clock Weather Card',
  description: 'Shows the current date/time in combination with the current weather and an iOS insipired weather forecast.',
  preview: true,
  documentationURL: 'https://github.com/pkissling/clock-weather-card'
})

// eslint-disable-next-line no-console
console.info(
  `%c  CLOCK-WEATHER-CARD \n%c Version: ${isDev ? 'DEV' : version}`,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
)

@customElement(customElementName)
export class ClockWeatherCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @state() private config!: ClockWeatherCardConfig
  @state() private misc: string | null = null

  protected render (): TemplateResult {
    return html`
      <ha-card>
        <h1>Hello World</h1>
        <p>Current Weather: ${this.getWeather().state}</p>
        <p>Misc: ${this.misc}</p>
        <img src="${animatedFillFogNight}" alt="Fog Night Animation">
      </ha-card>
    `
  }

  public setConfig(config: ClockWeatherCardConfig): void {
    console.log('setConifg', config)
    this.config = config
  }

  private getWeather (): Weather {
    const weather = this.hass.states[this.config.entity] as Weather | undefined
    if (!weather) {
      throw new Error(`Entity ${this.config.entity} not found`)
    }
    return weather
  }

  connectedCallback() {
    super.connectedCallback()
    translationsService.fetchTranslation('ar', 'weather.pouring')
      .then((translation) => {
        this.misc = translation
      })
  }
}
