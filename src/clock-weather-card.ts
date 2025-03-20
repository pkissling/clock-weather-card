import { defineCustomElement } from 'vue'
import MyApp from './App.vue'
import { type HomeAssistant } from 'custom-card-helpers'
import { version } from '../package.json'

console.info(
  `%c  CLOCK-WEATHER-CARD \n%c Version: ${version}`,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
)

const customElementName = `clock-weather-card-${import.meta.env.DEV ? 'dev' : ''}`

if (!customElements.get(`${customElementName}-ce`)) {
  const VueCustomElement = defineCustomElement(MyApp)
  customElements.define(`${customElementName}-ce`, VueCustomElement)
}

class VueCustomCard extends HTMLElement {
  private customElement: ClockWeatherCardCustomElement | undefined
  private _config: ClockWeatherCardConfig | undefined
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

  set config(config: ClockWeatherCardConfig) {
    if (!config) return
    this._config = config
    if (this.customElement) {
      this.customElement.config = this._config
    }
  }

  createVueApp() {
    this.customElement = document.createElement(`${customElementName}-ce`)
    this.customElement.hass = this._hass
    this.customElement.config = this._config
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
    description: 'Shows the current date/time in combination with the current weather and an iOS insipired weather forecast.',
    preview: import.meta.env.DEV,
    documentationURL: 'https://github.com/pkissling/clock-weather-card'
  })
}

if (!customElements.get(customElementName)) {
  customElements.define(customElementName, VueCustomCard)
}
