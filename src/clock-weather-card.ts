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

declare global {
  interface Window {
    customCards: { type: string; name: string; description?: string, preview?: boolean, documentationURL?: string}[];
  }
}

type VueElement = HTMLElement & { hass?: HomeAssistant; config?: Record<string, string> };

if (!customElements.get(`${customElementName}-ce`)) {
  const VueCustomElement = defineCustomElement(MyApp)
  customElements.define(`${customElementName}-ce`, VueCustomElement)
}

class VueCustomCard extends HTMLElement {
  private vueElement: VueElement | undefined 
  private config = {}
  private _hass: HomeAssistant | undefined

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  set hass(hass: HomeAssistant) {
    console.log('set hass', hass)
    this._hass = hass
    if (this.vueElement) {
      this.vueElement.hass = this._hass
    }
  }

  setConfig(config: unknown) {
    console.log('set config', config)
    if (!config) {
      return
    }
    this.config = config
    if (this.vueElement) {
      this.vueElement.config = this.config
    }
  }

  createVueApp() {
    this.vueElement = document.createElement(`${customElementName}-ce`)
    this.vueElement.hass = this._hass
    this.vueElement.config = this.config
    this.shadowRoot?.appendChild(this.vueElement)
  }

  connectedCallback() {
    if (!this.vueElement) {
      this.createVueApp()
    }
  }

  disconnectedCallback() {
    if (this.vueElement) {
      this.shadowRoot?.removeChild(this.vueElement)
      this.vueElement = undefined
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
