import { html, LitElement, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import translationsService from '@/service/translations-service'
import { generateCustomElementName, isDev } from '@/utils/development'

// eslint-disable-next-line no-restricted-imports
import { version } from '../package.json'

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
);

// This puts your card into the UI card picker dialog
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'clock-weather-card',
  name: 'Clock Weather Card',
  description: 'Shows the current date/time in combination with the current weather and an iOS insipired weather forecast.'
})

const gradientMap: Map<number, Rgb> = new Map()
  .set(-20, new Rgb(0, 60, 98)) // dark blue
  .set(-10, new Rgb(120, 162, 204)) // darker blue
  .set(0, new Rgb(164, 195, 210)) // light blue
  .set(10, new Rgb(121, 210, 179)) // turquoise
  .set(20, new Rgb(252, 245, 112)) // yellow
  .set(30, new Rgb(255, 150, 79)) // orange
  .set(40, new Rgb(255, 192, 159)) // red

@customElement('clock-weather-card')
export class ClockWeatherCard extends LitElement {
  protected render (): TemplateResult {
    translationsService.fetchTranslation('de', 'misc.aqi')
      .then((translation) => {
        // eslint-disable-next-line no-console
        console.log('translation', translation)
      })
    translationsService.fetchTranslations('de')
      .then((translations) => {
        // eslint-disable-next-line no-console
        console.log('translations', translations)
      })

    return html`
      <ha-card>
        <h1>Hello World</h1>
        <p>Current Weather: ${this.getWeather().state}</p>
        <p>Misc: ${this.misc}</p>
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
