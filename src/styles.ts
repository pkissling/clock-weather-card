import { css } from 'lit'

export default css`

  ha-card {
    --bar-height: 1.5rem;
    height: 100%;
  }

  clock-weather-card-today {
    display: flex;
  }

  clock-weather-card-today-start {
    display: flex;
    width: 35%;
    align-items: center;
    justify-content: center;
  }

  .grow-img {
    max-width: 100%;
    max-height: 100%;
  }

  clock-weather-card-today-end {
    display: flex;
    width: 65%;
    justify-content: space-around;
    align-items: center;
  }

  clock-weather-card-today-end-wrap {
    display: flex;
    flex-direction: column;
  }

  clock-weather-card-today-end-wrap-top {
    width: 100%;
    text-align: end;
    display: block;
  }

  clock-weather-card-today-end-wrap-center {
    display: flex;
    height: 4rem;
    font-size: 3.5rem;
    white-space: nowrap;
    align-items: center;
    justify-content: center;
  }

  clock-weather-card-today-end-wrap-bottom {
    display: flex;
    justify-content: start;
  }

  clock-weather-card-forecast {
    display: block;
  }

  clock-weather-card-forecast-row {
    display: grid;
    grid-template-columns: var(--col-one-size) 2rem 2.1rem auto 2.1rem;
    align-items: center;
    grid-gap: 0.5rem;
  }

  forecast-text {
    text-align: var(--text-align);
    white-space: nowrap;
    text-overflow: clip;
  }

  forecast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  forecast-temperature-bar {
    position: relative;
    width: 100%;
    height: var(--bar-height);
    border-radius: calc(var(--bar-height) / 2);
    overflow: hidden;
  }

  forecast-temperature-bar-background {
    inset-inline-start: 0%;
    inset-inline-end: 100%;
    width: 100%;
    opacity: 0.25;
    background: var(--light-primary-color);
  }

  forecast-temperature-bar-current-indicator-dot {
    --border-width: 2px;
    background-color: var(--primary-text-color);
    border-radius: 50%;
    width: var(--bar-height);
    box-shadow: inset 0 0 0 var(--border-width) var(--text-light-primary-color);
    margin-inline-start: calc(var(--move-end) * -1 * var(--bar-height));
  }

  forecast-temperature-bar-range {
    border-radius: calc(var(--bar-height) / 2);
    inset-inline-start:var(--start-percent);
    inset-inline-end: calc(100% - var(--end-percent));
    background: linear-gradient(to right, var(--gradient));
    overflow: hidden;
    min-width: var(--bar-height);
    margin-inline-start: calc(var(--move-end) * -1 * var(--bar-height));
  }

  [dir="rtl"] forecast-temperature-bar-range {
    background: linear-gradient(to left, var(--gradient));
  }

  forecast-temperature-bar-current-indicator {
    opacity: 0.75;
    inset-inline-start:var(--position);
  }

  forecast-temperature-bar-current-indicator,
  forecast-temperature-bar-current-indicator-dot,
  forecast-temperature-bar-background,
  forecast-temperature-bar-range {
    height: 100%;
    position: absolute;
  }

  aqi {
    padding: 2px;
    border-radius: 5px;
  }
`
