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
    scrollbar-width: thin;
  }

  clock-weather-card-hourly-forecast-item {
    flex: 0 0 auto;
    min-width: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 6px;
  }

  clock-weather-card-hourly-forecast-item:first-of-type {
    padding-left: 0;
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

  clock-weather-card-daily-forecast {
    display: block;
  }

  clock-weather-card-daily-forecast .rows {
    display: flex;
    flex-direction: column;
  }

  clock-weather-card-daily-forecast-item {
    display: grid;
    grid-template-columns: 2.5rem var(--cwc-daily-row-height, 28px) 2.5rem 1fr 2.5rem;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    line-height: 1;
    min-height: var(--cwc-daily-row-height, auto);
  }

  clock-weather-card-daily-forecast-item .day-label {
    font-weight: 500;
    opacity: 0.9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  clock-weather-card-daily-forecast-item clock-weather-card-icon {
    position: static;
    width: var(--cwc-daily-row-height, 28px);
    height: var(--cwc-daily-row-height, 28px);
    margin: 0;
    right: 0;
    display: block;
  }

  clock-weather-card-daily-forecast-item clock-weather-card-icon img {
    width: 100%;
    height: 100%;
    display: block;
  }

  clock-weather-card-daily-forecast-item .temperature-low,
  clock-weather-card-daily-forecast-item .temperature-high {
    font-variant-numeric: tabular-nums;
    opacity: 0.85;
    line-height: 1;
  }

  clock-weather-card-daily-forecast-item .temperature-low {
    text-align: right;
  }

  clock-weather-card-daily-forecast-item .temperature-high {
    text-align: left;
  }

  clock-weather-card-daily-forecast-item .bar-track {
    position: relative;
    height: calc(var(--cwc-daily-row-height, 28px) * var(--cwc-daily-bar-ratio, 0.6));
    min-height: 8px;
    background-color: var(--divider-color, rgba(127, 127, 127, 0.2));
    border-radius: 999px;
  }

  clock-weather-card-daily-forecast-item .bar-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 999px;
  }

  clock-weather-card-daily-forecast-item .dot {
    position: absolute;
    top: 50%;
    width: calc(var(--cwc-daily-row-height, 28px) * var(--cwc-daily-bar-ratio, 0.6) + 8px);
    height: calc(var(--cwc-daily-row-height, 28px) * var(--cwc-daily-bar-ratio, 0.6) + 8px);
    min-width: 14px;
    min-height: 14px;
    border-radius: 50%;
    background: var(--card-background-color, var(--ha-card-background, #fff));
    border: 2px solid var(--primary-text-color, currentColor);
    transform: translate(-50%, -50%);
    box-sizing: border-box;
  }

`
