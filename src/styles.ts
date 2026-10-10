import { css } from 'lit'

export default css`

  ha-card.clickable {
    cursor: pointer;
  }

  h1.card-header {
    padding-bottom: 0px;
  }

  clock-weather-card-error hui-error-card {
    overflow-wrap: anywhere;
  }

  clock-weather-card-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    container-type: inline-size;
  }

  clock-weather-card-header > clock-weather-card-icon {
    display: block;
    justify-self: center;
    /* The glyph fills the middle 80% of the box; the img's -10% margins crop the rest. */
    width: min(50cqi, var(--cwc-header-icon-size, max(var(--cwc-header-rows-height, 0px), 9rem)) / 0.8);
  }

  clock-weather-card-header > clock-weather-card-icon img {
    display: block;
    width: 100%;
    margin: -10% 0;
  }

  clock-weather-card-header-details {
    display: flex;
    flex-direction: column;
    justify-self: center;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  clock-weather-card-header-details-row {
    display: flex;
    align-items: center;
  }

  /* A flex gap would also pad around spacers, widening the row beyond its content. */
  clock-weather-card-header-details-row > :not(clock-weather-card-spacer-segment) ~ :not(clock-weather-card-spacer-segment) {
    margin-inline-start: 8px;
  }

  clock-weather-card-header-details-row > :is(clock-weather-card-icon-segment, clock-weather-card-weather-icon-segment) + :not(clock-weather-card-spacer-segment),
  clock-weather-card-header-details-row > :not(clock-weather-card-spacer-segment) + :is(clock-weather-card-icon-segment, clock-weather-card-weather-icon-segment) {
    margin-inline-start: 4px;
  }

  clock-weather-card-header-details-row > :not(clock-weather-card-spacer-segment) ~ clock-weather-card-spacer-segment + :not(clock-weather-card-spacer-segment) {
    margin-inline-start: 16px;
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

  .card-content > :first-child > clock-weather-card-divider:first-child {
    display: none;
  }

  clock-weather-card-divider[orientation="vertical"] {
    width: 1px;
    height: auto;
    align-self: stretch;
    margin: 0 2px;
  }

  clock-weather-card-forecast-strip {
    display: block;
  }

  clock-weather-card-forecast-strip .strip {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
  }

  clock-weather-card-forecast-strip-item {
    flex: 0 0 auto;
    min-width: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 7px;
  }

  clock-weather-card-forecast-strip-item:first-of-type {
    padding-inline-start: 0;
  }

  clock-weather-card-forecast-strip-item .time {
    font-size: 0.8rem;
    opacity: 0.7;
    line-height: 1;
  }

  clock-weather-card-forecast-strip-item clock-weather-card-icon {
    width: 40px;
    height: 40px;
    display: block;
  }

  clock-weather-card-forecast-strip-item clock-weather-card-icon img {
    width: 100%;
    height: 100%;
    display: block;
  }

  clock-weather-card-forecast-strip-item .label {
    display: inline-flex;
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1;
    --mdc-icon-size: 1em;
  }

  clock-weather-card-forecast-strip-item .temperature-low {
    font-size: 0.8rem;
    opacity: 0.6;
    line-height: 1;
    margin-top: 2px;
  }

  clock-weather-card-forecast-strip-item .attribute {
    font-size: 0.72rem;
    opacity: 0.65;
    color: var(--info-color, #4a90d9);
    line-height: 1;
    min-height: 0.72rem;
    display: flex;
    max-width: 5rem;
    align-items: center;
    gap: 2px;
    margin-top: 2px;
  }

  clock-weather-card-forecast-strip-item .attribute-value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  clock-weather-card-forecast-strip-item .attribute--monochrome {
    color: inherit;
  }

  clock-weather-card-forecast-strip-item .attribute ha-icon {
    --mdc-icon-size: 1em;
    display: inline-flex;
    flex: none;
  }

  clock-weather-card-forecast-list {
    display: block;
  }

  /* One grid shared by all rows so text columns size to their widest cell while staying aligned. */
  clock-weather-card-forecast-list .rows {
    display: grid;
    grid-template-columns: max-content var(--cwc-list-row-height) max-content 1fr max-content;
    grid-auto-rows: minmax(var(--cwc-list-row-height), auto);
    align-items: center;
    column-gap: 8px;
    font-size: 0.9rem;
    line-height: 1;
  }

  clock-weather-card-forecast-list-item {
    --_bar-thickness: var(--cwc-list-bar-thickness);
    --_dot-size: max(14px, calc(var(--_bar-thickness) + 8px));
    display: contents;
  }

  clock-weather-card-forecast-list-item .label {
    font-weight: 500;
    opacity: 0.9;
    white-space: nowrap;
  }

  clock-weather-card-forecast-list-item clock-weather-card-icon {
    width: var(--cwc-list-row-height);
    height: var(--cwc-list-row-height);
    display: block;
  }

  clock-weather-card-forecast-list-item clock-weather-card-icon img {
    width: 100%;
    height: 100%;
    display: block;
  }

  clock-weather-card-forecast-list-item .temperature-low,
  clock-weather-card-forecast-list-item .temperature-high {
    font-variant-numeric: tabular-nums;
    opacity: 0.85;
    line-height: 1;
  }

  clock-weather-card-forecast-list-item .temperature-low {
    text-align: end;
  }

  clock-weather-card-forecast-list-item .temperature-high {
    text-align: start;
  }

  clock-weather-card-forecast-list-item .bar-track {
    position: relative;
    height: var(--_bar-thickness);
    min-height: 8px;
    background-color: var(--divider-color, rgba(127, 127, 127, 0.2));
    border-radius: 999px;
  }

  clock-weather-card-forecast-list-item:dir(rtl) .bar-track {
    transform: scaleX(-1);
  }

  clock-weather-card-forecast-list-item .bar-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 999px;
  }

  clock-weather-card-forecast-list-item .dot {
    position: absolute;
    top: 50%;
    left: clamp(calc(var(--_dot-size) / 2), var(--_dot-left), calc(100% - var(--_dot-size) / 2));
    width: var(--_dot-size);
    height: var(--_dot-size);
    border-radius: 50%;
    background: var(--card-background-color, var(--ha-card-background, #fff));
    border: 2px solid var(--primary-text-color, currentColor);
    transform: translate(-50%, -50%);
    box-sizing: border-box;
  }

`
