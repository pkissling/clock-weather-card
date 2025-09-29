import { css } from 'lit'

export default css`

  ha-card {
    --bar-height: 1.5rem;
    height: 100%;
  }

  clock-weather-card-today {
    display: flex;
  }

  clock-weather-card-today-left {
    display: flex;
    width: 25%;
    align-items: center;
    justify-content: center;
    z-index: 1;
    position: relative;
  }

  .oversized-bg-icon {
    max-width: 200%;
    max-height: 200%;
    width: 150%;
    height: 150%;
    opacity: 0.8;
    z-index: 2;
    transform: scale(1.5);
  }

  clock-weather-card-today-right {
    display: flex;
    width: 75%;
    justify-content: space-around;
    align-items: center;
    z-index: 3; /* Ensure it is below the icon */
  }

  clock-weather-card-today-right-wrap {
    display: flex;
    flex-direction: column;
    z-index: 3;
  }

  clock-weather-card-today-right-wrap-top {
    width: 100%;
    text-align: end;
    display: block;
    z-index: 3;
  }

  clock-weather-card-today-right-wrap-center {
    display: flex;
    height: 8rem;
    font-size: 7rem;
    white-space: nowrap;
    align-items: center;
    justify-content: center;
    transition: opacity 0.5s ease; /* Smooth transitions for swapping content */
    z-index: 3;
  }

  clock-weather-card-today-right-wrap-bottom {
    display: flex;
    justify-content: start;
    z-index: 3;
  }

  clock-weather-card-forecast {
    display: block;
  }

  clock-weather-card-forecast-row {
    display: grid;
    grid-template-columns: var(--col-one-size) 2rem 2.1rem auto 2.1rem;
    align-items: center;
    grid-gap: 0.5rem;
    z-index: 3;
  }

  forecast-text {
    text-align: var(--text-align);
    white-space: nowrap;
    text-overflow: clip;
    z-index: 3;
  }

  forecast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
  }

  forecast-temperature-bar {
    position: relative;
    width: 100%;
    height: var(--bar-height);
    border-radius: calc(var(--bar-height) / 2);
    overflow: hidden;
    z-index: 3;
  }

  forecast-temperature-bar-background {
    left: 0%;
    right: 100%;
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
    margin-left: calc(var(--move-right) * -1 * var(--bar-height));
  }

  forecast-temperature-bar-range {
    border-radius: calc(var(--bar-height) / 2);
    left: var(--start-percent);
    right: calc(100% - var(--end-percent));
    background: linear-gradient(to right, var(--gradient));
    overflow: hidden;
    min-width: var(--bar-height);
    margin-left: calc(var(--move-right) * -1 * var(--bar-height));
  }

  forecast-temperature-bar-current-indicator {
    opacity: 0.75;
    left: var(--position);
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

