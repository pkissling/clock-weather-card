import { css } from 'lit';

export default css`
  .clock-weather-card {
    padding: 1rem;
  }

  clock-weather-card-today {
    display: flex;
  }

  clock-weather-card-today-left {
    display: flex;
    width: 35%;
    align-items: center;
    justify-content: center;
  }

  .grow-img {
    max-width: 100%;
    max-height: 100%;
  }

  clock-weather-card-today-right {
    display: flex;
    width: 65%;
    justify-content: space-around;
    align-items: center;
  }

  clock-weather-card-today-right-wrap {
    display: flex;
    flex-direction: column;
  }

  clock-weather-card-today-right-wrap-top {
    display: flex;
    justify-content: end;
  }

  clock-weather-card-today-right-wrap-center {
    display: flex;
    height: 4rem;
    align-items: center;
    font-size: 4rem;
  }

  clock-weather-card-today-right-wrap-bottom {
    display: flex;
    justify-content: start;
  }

  clock-weather-card-forecast {
    display: flex;
    flex-direction: column;
  }

  clock-weather-card-forecast-row {
    display: grid;
    grid-template-columns: 2rem 2rem 2rem auto 2rem;
    align-items: center;
    grid-gap: 0.5rem;
  }

  forecast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  forecast-temperature-bar {
    position: relative;
    width: 100%;
    height: 1.5rem;
    border-radius: var(--ha-card-border-radius);
    overflow: hidden;
  }

  forecast-temperature-bar-background {
    width: 100%;
    opacity: 0.25;
    background: var(--light-primary-color);
  }

  forecast-temperature-bar-current-indicator {
    left: var(--position);
  }

  forecast-temperature-bar-current-indicator-bar {
    background-color: var(--text-light-primary-color);
    width: 2px;
    margin-left: -1px;
  }

  forecast-temperature-bar-current-indicator-temp {
    color: var(--text-light-primary-color);
    margin-right: 0.2rem;
    margin-left: 0.2rem;
    align-items: center;
    display: grid;
    left: var(--left);
    right: var(--right);
  }

  forecast-temperature-bar-range {
    left: var(--start-percent);
    right: calc(100% - var(--end-percent));
    background: linear-gradient(to right, var(--gradient));
  }

  forecast-temperature-bar-current-indicator-bar,
  forecast-temperature-bar-current-indicator-temp {
    opacity: 0.5;
  }

  forecast-temperature-bar-current-indicator,
  forecast-temperature-bar-current-indicator-bar,
  forecast-temperature-bar-current-indicator-temp,
  forecast-temperature-bar-background,
  forecast-temperature-bar-range {
    height: 100%;
    position: absolute;
  }
`;
