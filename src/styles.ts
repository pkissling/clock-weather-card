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

`
