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
    width: 100%;
    height: auto;
  }

  clock-weather-card-today-details {
    display: flex;
    align-items: center;
    height: 100%;
  }

  clock-weather-card-time {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .time {
    white-space: nowrap;
    line-height: 1;
    font-weight: 500;
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
`
