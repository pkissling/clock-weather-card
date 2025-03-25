import { defineCustomElement } from 'vue'
import ClockWeatherCard from './ClockWeatherCard.vue'
import { type HomeAssistant } from 'custom-card-helpers'
import { version } from '../package.json'

const isDev = import.meta.env.DEV

console.info(
  `%c  CLOCK-WEATHER-CARD \n%c Version: ${isDev ? 'preview' : version} `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
)

const customElementName = `clock-weather-card-${isDev ? 'dev' : ''}`

class VueCustomCard extends HTMLElement {
  private customElement: ClockWeatherCard | undefined
  private config: ClockWeatherCardConfig | undefined
  private _hass: HomeAssistant | undefined

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass
    if (this.customElement) {
      this.customElement.hass = this._hass
    }
  }

  setConfig(config: ClockWeatherCardConfig) {
    if (!config) return
    this.config = config
    if (this.customElement) {
      this.customElement.config = this.config
    }
  }

  createVueApp() {
    this.customElement = document.createElement(`${customElementName}-ce`)
    this.customElement.hass = this._hass
    this.customElement.config = this.config
    this.shadowRoot?.appendChild(this.customElement)
  }

  connectedCallback() {
    if (!this.customElement) {
      this.createVueApp()
    }
  }

  disconnectedCallback() {
    if (this.customElement) {
      this.shadowRoot?.removeChild(this.customElement)
      this.customElement = undefined
    }
  }
}

window.customCards = window.customCards || []

if (!window.customCards.some((card) => card.type === customElementName)) {
  window.customCards.push({
    type: customElementName,
    name: 'Clock Weather Card',
    description:
      'Shows the current date/time in combination with the current weather and an iOS insipired weather forecast.',
    preview: isDev,
    documentationURL: 'https://github.com/pkissling/clock-weather-card',
  })
}

customElements.get(customElementName) || customElements.define(customElementName, VueCustomCard)
customElements.get(`${customElementName}-ce`) || customElements.define(`${customElementName}-ce`, defineCustomElement(ClockWeatherCard))
