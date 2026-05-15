import { css } from 'lit'

export default css`

  ha-card {
    cursor: pointer; // TODO conditional!
  }

  h1.card-header {
    padding-bottom: 0px;
  }

  clock-weather-card-today {
    display: grid;
    grid-template-columns: 50% 50%;
    align-items: center;
    height: auto;
  }

  clock-weather-card-icon {
    position: relative;
    width: 100%;
    margin-top: -10%;
    margin-bottom: -10%;
    margin-left: -20%;
    margin-right: -20%;
    right: -20%;
  }

  clock-weather-card-today-details {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  clock-weather-card-today-details-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  clock-weather-card-spacer-segment {
    flex: 1;
  }

  clock-weather-card-time-segment,
  clock-weather-card-date-segment,
  clock-weather-card-weather-segment,
  clock-weather-card-entity-segment {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1;
  }

  clock-weather-card-icon-segment {
    display: flex;
    align-items: center;
    line-height: 1;
  }

  clock-weather-card-divider {
    display: block;
    background-color: var(--divider-color, rgba(127, 127, 127, 0.2));
    margin: 2px 0;
  }

  clock-weather-card-divider[orientation="horizontal"] {
    width: 100%;
    height: 1px;
  }

  clock-weather-card-divider[orientation="vertical"] {
    width: 1px;
    height: auto;
    align-self: stretch;
    margin: 0 2px;
  }

  clock-weather-card-hourly-forecast {
    display: block;
  }

  clock-weather-card-hourly-forecast .strip {
    display: flex;
    gap: 2px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  clock-weather-card-hourly-forecast .strip::-webkit-scrollbar {
    display: none;
  }

  clock-weather-card-hourly-forecast-item {
    flex: 0 0 auto;
    min-width: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 6px;
  }

  clock-weather-card-hourly-forecast-item .time {
    font-size: 0.8rem;
    opacity: 0.7;
    line-height: 1;
  }

  clock-weather-card-hourly-forecast-item clock-weather-card-icon {
    position: static;
    width: 40px;
    height: 40px;
    margin: 0;
    right: 0;
    display: block;
  }

  clock-weather-card-hourly-forecast-item clock-weather-card-icon img {
    width: 100%;
    height: 100%;
    display: block;
  }

  clock-weather-card-hourly-forecast-item .temperature {
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1;
  }

  clock-weather-card-hourly-forecast-item .precipitation {
    font-size: 0.72rem;
    opacity: 0.65;
    color: var(--info-color, #4a90d9);
    line-height: 1;
    min-height: 0.72rem;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-top: 2px;
  }

  clock-weather-card-hourly-forecast-item .precipitation--monochrome {
    color: inherit;
  }

  clock-weather-card-hourly-forecast-item .precipitation ha-icon {
    --mdc-icon-size: 1em;
    display: inline-flex;
  }

`
