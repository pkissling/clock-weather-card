import { css } from 'lit'

export default css`

  ha-card {
    --bar-height: 1.5rem;
    height: 100%;
  }

  /* Prevent the today section from stretching to fill the full card height */
  .card-content {
    display: flex;
    flex-direction: column;
  }

  clock-weather-card-today {
    display: flex;
    flex: 0 0 auto;
    align-items: stretch;
  }

  clock-weather-card-today-left {
    display: flex;
    flex-direction: column;
    width: 40%;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.2rem;
    gap: 0.3rem;
  }

  .grow-img {
    /* Cap icon height so the today section stays compact */
    max-width: 100%;
    max-height: 5.5rem;
    object-fit: contain;
  }

  clock-weather-card-today-left-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    font-size: 0.8rem;
    line-height: 1.35;
    width: 100%;
    color: var(--secondary-text-color);
  }

  clock-weather-card-today-right {
    display: flex;
    width: 60%;
    justify-content: center;
    align-items: center;
  }

  clock-weather-card-today-right-wrap {
    /* Flex column: clock on top, date below – height driven by content, not by grid stretch */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    /* Enables cqw (container query width) for font-size capping */
    container-type: inline-size;
    padding: 0.3rem 0;
    gap: 0.15rem;
  }

  clock-weather-card-today-right-wrap-center {
    display: flex;
    /* min() clamps font size to the smaller of the rem value and the cqw limit,
       so the clock never overflows the container.
       33cqw ≈ max safe width for "HH:mm" (5 chars at ~0.6em each) */
    font-size: min(var(--time-font-size, 5rem), var(--time-max-cqw, 33cqw));
    line-height: 1.0;
    white-space: nowrap;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  clock-weather-card-today-right-wrap-bottom {
    display: flex;
    justify-content: center;
    font-size: 0.85rem;
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
