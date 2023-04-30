import { LitElement, html, css } from 'lit-element';
import { HomeAssistant, WeatherEntity } from 'custom-card-helpers';

class ClockWeather extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      weatherEntity: { type: Object },
      timeFormat: { type: String },
    };
  }

  static get styles() {
    return css`
      .clock {
        font-size: 2rem;
        font-weight: bold;
      }

      .weather {
        font-size: 1.5rem;
        margin-top: 0.5rem;
      }
    `;
  }

  constructor() {
    super();
    this.weatherEntity = null;
    this.timeFormat = 'h:mm A';
  }

  render() {
    return html`
      <div class="clock">${this._getTime()}</div>
      ${this.weatherEntity
        ? html`<div class="weather">${this._getWeather()}</div>`
        : null}
    `;
  }

  setConfig(config) {
    if (!config.weather_entity) {
      throw new Error('Please provide a weather entity');
    }
    this.weatherEntity = config.weather_entity;
    if (config.time_format) {
      this.timeFormat = config.time_format;
    }
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    if (this.weatherEntity) {
      this.weatherEntity = hass.states[this.weatherEntity];
    }
  }

  _getTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat(this._hass.locale, {
      hour: this.timeFormat.includes('h') ? 'numeric' : undefined,
      minute: 'numeric',
      hour12: this.timeFormat.includes('A'),
    });
    return formatter.format(now);
  }

  _getWeather() {
    const stateObj = this._hass.states[this.weatherEntity];
    const weatherState = stateObj.state;
    const temperature = stateObj.attributes.temperature;
    return `${weatherState} ${temperature}°C`;
  }
}

customElements.define('clock-weather', ClockWeather);
