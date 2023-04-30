import { LitElement, html, customElement, property } from 'lit-element';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
}

@customElement('clock-weather-card')
export class ClockWeatherCard extends LitElement {

  @property({ type: String }) apiKey = 'YOUR_OPENWEATHERMAP_API_KEY';
  @property({ type: String }) location = 'New York';
  @property({ type: Number }) updateInterval = 300000; // 5 minutes

  private timeInterval: NodeJS.Timeout;
  private weatherData: WeatherData;

  connectedCallback() {
    super.connectedCallback();
    this.getTime();
    this.getWeather();
    this.timeInterval = setInterval(() => {
      this.getTime();
      this.getWeather();
    }, this.updateInterval);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.timeInterval);
  }

  async getWeather() {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${this.location}&units=metric&appid=${this.apiKey}`);
    if (response.ok) {
      const data = await response.json();
      this.weatherData = {
        name: data.name,
        main: data.main,
        weather: data.weather
      };
      this.requestUpdate();
    } else {
      console.error(`Error fetching weather data: ${response.statusText}`);
    }
  }

  getTime() {
    const now = new Date();
    this.shadowRoot!.getElementById('clock')!.textContent = now.toLocaleTimeString();
  }

  render() {
    return html`
      <style>
        .card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 200px;
          height: 200px;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-family: Arial, sans-serif;
        }
        .card__time {
          font-size: 24px;
          margin-bottom: 16px;
        }
        .card__location {
          font-size: 18px;
          margin-bottom: 8px;
        }
        .card__icon {
          width: 64px;
          height: 64px;
          margin-bottom: 8px;
        }
        .card__temp {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .card__description {
          font-size: 16px;
        }
      </style>
      <div class="card">
        <div class="card__time" id="clock"></div>
        ${this.weatherData ? html`
          <div class="card__location">${this.weatherData.name}</div>
          <img class="card__icon" src="https://openweathermap.org/img/w/${this.weatherData.weather[0].icon}.png" alt="${this.weatherData.weather[0].description}">
          <div class="card__temp">${this.weatherData.main.temp.toFixed(1)}&deg;C</div>
          <div class="card__description">${this.weatherData.weather[0].description}</div>
        ` : ''}
      </div>
    `;
  }

}
