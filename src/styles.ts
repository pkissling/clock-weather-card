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

  /* Meteocons clouds are near-white and vanish on light backgrounds without an outline. */
  clock-weather-card-icon img {
    filter: drop-shadow(0 0 1px rgb(0 0 0 / 0.35));
  }

  clock-weather-card-header > clock-weather-card-icon img {
    display: block;
    width: 100%;
    margin: -10% 0;
    /* Meteocons sit low in their canvas; raindrops would otherwise touch the divider below. */
    translate: 0 -4%;
  }

  clock-weather-card-header-details {
    display: flex;
    flex-direction: column;
    row-gap: 2px;
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
    padding-block: 0.2em;
    margin-block: -0.2em;
  }

  clock-weather-card-icon-segment {
    display: flex;
    align-items: center;
    line-height: 1;
  }

  clock-weather-card-divider {
    display: block;
    background-color: var(--divider-color, rgba(127, 127, 127, 0.2));
    height: 1px;
    margin: 2px 0;
  }

  .card-content > :first-child > clock-weather-card-divider:first-child {
    display: none;
  }

  clock-weather-card-forecast-strip {
    display: block;
  }

  /* Text sizes are in em so sections.forecast_strip.font_size scales them; the icon follows only when it is set. */
  clock-weather-card-forecast-strip .strip {
    --_icon-size: var(--cwc-strip-icon-size, 40px);
    font-size: 1rem;
    display: flex;
    justify-content: space-between;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
  }

  clock-weather-card-forecast-strip-item,
  clock-weather-card-forecast-strip .skeleton-item {
    flex: 0 0 auto;
    min-width: var(--_icon-size);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 7px;
  }

  clock-weather-card-forecast-strip-item:first-of-type,
  clock-weather-card-forecast-strip .skeleton-item:first-of-type {
    padding-inline-start: 0;
  }

  clock-weather-card-forecast-strip-item:last-of-type {
    padding-inline-end: 0;
  }

  clock-weather-card-forecast-strip-item .time {
    font-size: 0.8em;
    opacity: 0.7;
    line-height: 1;
    max-width: 5em;
    overflow-x: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  clock-weather-card-forecast-strip-item clock-weather-card-icon {
    width: var(--_icon-size);
    height: var(--_icon-size);
    display: block;
  }

  clock-weather-card-forecast-strip-item clock-weather-card-icon img {
    width: 100%;
    height: 100%;
    display: block;
  }

  clock-weather-card-forecast-strip-item .label {
    display: inline-flex;
    font-size: 1em;
    font-weight: 500;
    line-height: 1;
    --mdc-icon-size: 1em;
  }

  clock-weather-card-forecast-strip-item .temperature-low {
    font-size: 0.8em;
    opacity: 0.6;
    line-height: 1;
    margin-top: 2px;
  }

  clock-weather-card-forecast-strip-item .attribute {
    font-size: 0.72em;
    opacity: 0.65;
    color: var(--info-color, #4a90d9);
    line-height: 1;
    min-height: 1em;
    display: flex;
    max-width: calc(5em / 0.72);
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
    --_icon-size: var(--cwc-list-icon-size, var(--cwc-list-row-height));
    grid-template-columns: max-content var(--_icon-size) max-content 1fr max-content;
    grid-auto-rows: minmax(var(--cwc-list-row-height), auto);
    align-items: center;
    column-gap: 8px;
    font-size: var(--cwc-list-font-size, 1rem);
    font-weight: 500;
    line-height: 1;
  }

  clock-weather-card-forecast-list-item {
    --_bar-thickness: var(--cwc-list-bar-thickness);
    --_dot-size: max(14px, calc(var(--_bar-thickness) + 8px));
    display: contents;
  }

  clock-weather-card-forecast-list-item .label {
    max-width: 5em;
    overflow-x: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  clock-weather-card-forecast-list-item clock-weather-card-icon {
    width: var(--_icon-size);
    height: var(--_icon-size);
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
    background-color: var(--clock-weather-card-bar-track-color, color-mix(in srgb, var(--secondary-text-color, #727272) 10%, transparent));
    border-radius: 999px;
    box-shadow: 0 0 1px rgb(0 0 0 / 0.35);
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
    z-index: 1;
  }

  .skeleton {
    display: block;
    border-radius: 999px;
    background-color: var(--divider-color, rgba(127, 127, 127, 0.2));
    animation: cwc-skeleton-pulse 1.5s ease-in-out infinite;
  }

  @keyframes cwc-skeleton-pulse {
    50% {
      opacity: 0.4;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton {
      animation: none;
    }
  }

  clock-weather-card-template-segment .skeleton--text {
    width: 4em;
    height: 0.8em;
  }

  clock-weather-card-forecast-strip .skeleton--time {
    width: 1.6em;
    height: 0.8em;
  }

  clock-weather-card-forecast-strip .skeleton--icon {
    width: calc(var(--_icon-size) * 0.7);
    height: calc(var(--_icon-size) * 0.7);
    margin: calc(var(--_icon-size) * 0.15);
    border-radius: 50%;
  }

  clock-weather-card-forecast-strip .skeleton--label {
    width: 1.8em;
    height: 1em;
  }

  clock-weather-card-forecast-strip .skeleton--attribute {
    width: 1.6em;
    height: 0.72em;
    margin-top: 2px;
  }

  clock-weather-card-forecast-list .skeleton--label {
    width: 2.4em;
    height: 1em;
  }

  clock-weather-card-forecast-list .skeleton--icon {
    width: 70%;
    aspect-ratio: 1;
    justify-self: center;
    border-radius: 50%;
  }

  clock-weather-card-forecast-list .skeleton--temperature {
    width: 1.8em;
    height: 1em;
  }

  clock-weather-card-forecast-list .skeleton--bar {
    height: var(--cwc-list-bar-thickness);
    min-height: 8px;
  }

`
