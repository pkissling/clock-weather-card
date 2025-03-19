import { defineCustomElement } from 'vue';
import MyApp from './App.vue';
import { type HomeAssistant } from 'custom-card-helpers';

if (!customElements.get('clock-weather-card-ce')) {
    const VueCustomElement = defineCustomElement(MyApp);
    customElements.define('clock-weather-card-ce', VueCustomElement);
}

declare global {
    interface Window {
        customCards: any[];
    }
}

type VueElement = HTMLElement & { hass?: HomeAssistant, config?: unknown };

class VueCustomCard extends HTMLElement {

    private vueElement: VueElement | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.vueElement = null;
    }

    set hass(hass: HomeAssistant) {
        if (this.vueElement) {
            this.vueElement.hass = hass;
        }
    }

    setConfig(config: unknown) {
        if (!config) {
            return;
        }
        if (this.vueElement) {
            this.vueElement.config = config;
        }
    }

    createVueApp() {
        this.vueElement = document.createElement('clock-weather-card-ce');
        this.shadowRoot?.appendChild(this.vueElement);
    }

    connectedCallback() {
        if (!this.vueElement) {
            this.createVueApp();
        }
    }

    disconnectedCallback() {
        if (this.vueElement) {
            this.shadowRoot?.removeChild(this.vueElement);
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
