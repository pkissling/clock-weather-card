import { css } from 'lit';

export default css`

  ha-card {
    --bar-height: 1.5rem;
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
    height: var(--bar-height);
    border-radius: calc(var(--bar-height) / 2);
    overflow: hidden;
  }

  forecast-temperature-bar-background {
    width: 100%;
    opacity: 0.25;
    background: var(--light-primary-color);
  }


  forecast-temperature-bar-current-indicator-dot {
    --border-width: 2px;
    --double-border-width: calc(var(--border-width) * 2);
    background-color: var(--primary-text-color);
    height: calc(100% - var(--double-border-width)) !important;
    border-radius: 50%;
    aspect-ratio: 1/1;
    border: var(--border-width) solid var(--text-light-primary-color);
    margin-left: calc(var(--move-left) * -1 * var(--bar-height));
  }
  
  forecast-temperature-bar-current-indicator-temp {
    color: var(--text-light-primary-color);
    position: relative !important;
    display: grid;
    align-items: center;
    margin-right: calc(var(--bar-height) + 0.2rem);
    margin-left: calc(var(--bar-height) + 0.2rem);
    left: var(--left);
    right: var(--right);
  }

  forecast-temperature-bar-range {
    border-radius: calc(var(--bar-height) / 2);
    left: var(--start-percent);
    right: calc(100% - var(--end-percent));
    background: linear-gradient(to right, var(--gradient));
    overflow: hidden;
  }

  forecast-temperature-bar-current-indicator {
    opacity: 0.75;
    left: var(--position);
  }

  forecast-temperature-bar-current-indicator,
  forecast-temperature-bar-current-indicator-dot,
  forecast-temperature-bar-current-indicator-temp,
  forecast-temperature-bar-background,
  forecast-temperature-bar-range {
    height: 100%;
    position: absolute;
  }
`;
