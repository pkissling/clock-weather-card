import { html, LitElement, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'

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
)

@customElement(customElementName)
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
      <div>
        <h1>Hello World</h1>
      </div>
    `
  }

  public setConfig(_: unknown): void {
  }
}
