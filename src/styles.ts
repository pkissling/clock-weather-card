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
    /* Grid: Wetter-Info oben, Uhr flexibel mittig, Datum unten – stabile Positionen */
    display: grid;
    grid-template-rows: auto 1fr auto;
    width: 100%;
    /* Aktiviert cqw (Container Query Width) für font-size-Begrenzung */
    container-type: inline-size;
  }

  clock-weather-card-today-right-wrap-top {
    width: 100%;
    text-align: end;
    display: block;
    align-self: start;
  }

  clock-weather-card-today-right-wrap-center {
    display: flex;
    /* min() begrenzt Schriftgröße auf das kleinere von rem-Wert und cqw-Limit,
       damit die Uhr nie den Container-Rand überschreitet */
    font-size: min(var(--time-font-size, 3.5rem), var(--time-max-cqw, 28cqw));
    line-height: 1.1;
    padding: 0.2rem 0;
    white-space: nowrap;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    align-self: center;
  }

  clock-weather-card-today-right-wrap-bottom {
    display: flex;
    justify-content: start;
    align-self: end;
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
