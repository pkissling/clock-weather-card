import { defineCustomElement } from 'vue';
import MyApp from './App.vue';

if (!customElements.get('clock-weather-card-ce')) {
    const VueCustomElement = defineCustomElement(MyApp);
    customElements.define('clock-weather-card-ce', VueCustomElement);
}

class VueCustomCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.vueElement = null;
        this.config = {};
    }

    set hass(hass) {
        if (this.vueElement) {
            this.vueElement.hass = hass;
        }
    }

    setConfig(config) {
        if (!config) {
            return;
        }

        this.config = config;
        if (this.vueElement) {
            this.vueElement.config = this.config;
        }
    }

    createVueApp() {
        this.vueElement = document.createElement('clock-weather-card-ce');
        this.shadowRoot.appendChild(this.vueElement);
        this.vueElement.config = this.config;
    }

    connectedCallback() {
        if (!this.vueElement) {
            this.createVueApp();
        }
    }

    disconnectedCallback() {
        if (this.vueElement) {
            this.shadowRoot.removeChild(this.vueElement);
            this.vueElement = null;
        }
    }
}


window.customCards = window.customCards || [];

if (!window.customCards.some(card => card.type === 'clock-weather-card')) {
    window.customCards.push({
        type: 'clock-weather-card',
        name: 'Vue Custom Card',
        preview: true,
        description: 'A custom card created in Vue 3',
    });
}

if (!customElements.get('clock-weather-card')) {
    customElements.define('clock-weather-card', VueCustomCard);
}
