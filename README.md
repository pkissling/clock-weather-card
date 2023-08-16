# Clock Weather Card

[![HACS](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://github.com/hacs/integration)
[![Total downloads](https://img.shields.io/github/downloads/pkissling/clock-weather-card/total)](https://github.com/pkissling/clock-weather-card/releases)
[![Downloads of latest version (latest by SemVer)](https://img.shields.io/github/downloads/pkissling/clock-weather-card/latest/total?sort=semver)](https://github.com/pkissling/clock-weather-card/releases/latest)
[![Current version](https://img.shields.io/github/v/release/pkissling/clock-weather-card)](https://github.com/pkissling/clock-weather-card/releases/latest)

A [Home Assistant Dashboard Card](https://www.home-assistant.io/dashboards/) available through the [Home Assistant Community Store](https://hacs.xyz)
showing the current date, time and a weather forecast.

![Clock Weather Card](.github/assets/card.gif)
[^1]

Credits go to [basmilius](https://github.com/basmilius) for the awesome [weather icons](https://github.com/basmilius/weather-icons).

## FAQ

- [Why don't I see the current day in my weather forecast?](#why-dont-i-see-the-current-day-in-my-weather-forecast)
- [Why does the forecast show less days than expected?](#why-does-the-forecast-show-less-days-than-expected)
- [What does the card actually display?](#what-does-the-card-actually-display)

### Why don't I see the current day in my weather forecast?

Your weather provider may not provide today's weather as part of their weather forecast. You may consider switching to a different weather provider.
[OpenWeatherMap](https://www.home-assistant.io/integrations/openweathermap/) is one of the weather integrations providing today's weather.

### Why does the forecast show less days than expected?

Depending on your Home Assistant's configuration, your weather provider might deliver forecasts *hourly*. If this is the case, the weather integrations delivers 48 distinct forecasts (This corresponds to forecasts for the next 48 hours). You might want to consider supplying a weather entity which supplies *daily* forecasts for the card.

### What does the card actually display?

![image](https://user-images.githubusercontent.com/33731393/221779555-c2c25e12-4ff0-4c61-8fd7-94d5b1b214d3.png)

The bars represent the temperature range for a given day.
In the above image, the 9° on Thursday represents the low across all of the forecast days and the 21° represents the highs (i.e. all bars are from 9° to 21°).
The colored portion of the bar represents the range of temperatures that are forecast for that day (so 12° to 21° on Monday).
The circle represents the current temperature (16° or roughly midway between 12° and 21° in your case).

*Thanks to @deprecatedcoder for this text from [#143](https://github.com/pkissling/clock-weather-card/issues/143)*

The basic idea of the forecast bars is to be able to understand the weather trend for the upcoming days in a single glance.

## Installation

### Manual Installation

1. Download the [clock-weather-card](https://www.github.com/pkissling/clock-weather-card/releases/latest/download/clock-weather-card.js).
2. Place the file in your Home Assistant's `config/www` folder.
3. Add the configuration to your `ui-lovelace.yaml`.

   ```yaml
   resources:
     - url: /local/clock-weather-card.js
       type: module
   ```

4. Add [configuration](#configuration) for the card in your `ui-lovelace.yaml`.

### Installation and tracking with `hacs`

1. Make sure the [HACS](https://github.com/custom-components/hacs) component is installed and working.
2. Search for `clock-weather-card` in HACS and install it.
3. Depening on whether you manage your Lovelace resources via YAML (3i) or UI (3ii), you have to add the corresponding resources.
   1. **YAML:** Add the configuration to your `ui-lovelace.yaml`.

      ```yaml
      resources:
        - url: /hacsfiles/clock-weather-card/clock-weather-card.js
          type: module
      ```

   2. **UI:** Add Lovelace resource [![My Home Assistant](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_resources).
      *(Alternatively go to Settings -> Dashboards -> Resources -> Add Resource)*

      ```yaml
      URL: /hacsfiles/clock-weather-card/clock-weather-card.js
      Type: JavaScript Module
      ```

4. Restart Home Assistant.
5. Add [configuration](#configuration) for the card in your `ui-lovelace.yaml` or via the UI.

## Configuration

### Minimal configuration

```yaml
- type: custom:clock-weather-card
  entity: weather.home
```

### Full configuration

```yaml
- type: custom:clock-weather-card
  entity: weather.home
  title: Home
  sun_entity: sun.sun
  temperature_sensor: sensor.outdoor_temp
  weather_icon_type: line
  animated_icon: true
  forecast_days: 5
  locale: en-GB
  time_format: 24
  date_pattern: P
  hide_today_section: false
  hide_forecast_section: false
  hide_clock: false
  hide_date: false
  hourly_forecast: false
  use_browser_time: true
```

### Options

| Name                  | Type             | Requirement  | Description                                                                                                                                                                                                                       | Default   |
| --------------------- | ---------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| type                  | string           | **Required** | `custom:clock-weather-card`                                                                                                                                                                                                       |           |
| entity                | string           | **Required** | ID of the weather entity                                                                                                                                                                                                          |           |
| title                 | string           | **Optional** | Title of the card                                                                                                                                                                                                                 | `''`      |
| sun_entity            | boolean          | **Optional** | ID of the sun entity. Used to determine whether to show a day or night icon. If sun integration is not enabled, day icon will be shown                                                                                            | `sun.sun` |
| temperature_sensor    | string           | **Optional** | ID of the temperature sensor entity. Used to show the current temperature based on a sensor value instead of the weather forecast                                                                                                 | `''`      |
| weather_icon_type     | `line` \| `fill` | **Optional** | Appearance of the large weather icon                                                                                                                                                                                               | `line`    |
| animated_icon         | boolean          | **Optional** | Whether the large weather icon should be animated                                                                                                                                                                                 | `true`    |
| forecast_days         | number           | **Optional** | Days of weather forecast to show                                                                                                                                                                                                  | `5`       |
| locale                | string[^2]       | **Optional** | Language to use for language specific text. If not provided, falls back to the locale set in HA                                                                                                                                    | `en-GB`   |
| time_format           | `24` \| `12`     | **Optional** | Format used to display the time. If not provided, falls back to the time format set in HA                                                                                                                                         | `24`      |
| date_pattern          | string           | **Optional** | Pattern to use for time formatting. If not provided, falls back to the default date formatting of the configured language. See [date-fns](https://date-fns.org/v2.29.3/docs/format) for valid patterns                             | `P`       |
| hide_today_section    | boolean          | **Optional** | Hides the cards today section (upper section), containing the large weather icon, clock and current date                                                                                                                          | `false`   |
| hide_forecast_section | boolean          | **Optional** | Hides the cards forecast section (lower section),containing the weather forecast                                                                                                                                                  | `false`   |
| hide_clock            | boolean          | **Optional** | Hides the clock from the today section and prominently displays the current temperature instead                                                                                                                                   | `false`   |
| hide_date             | boolean          | **Optional** | Hides the date from the today section                                                                                                                                                                                             | `false`   |
| hourly_forecast       | boolean          | **Optional** | Displays an hourly forecast instead of daily                                                                                                                                                                                      | `false`   |
| use_browser_time      | boolean          | **Optional** | Uses the time from your browser to indicate the current time. If not provided, falls back to the [`time_zone`](https://www.home-assistant.io/blog/2015/05/09/utc-time-zone-awareness/#setting-up-your-time-zone) configured in HA  | `true`    |

## Footnotes

[^1]: Theme used: [lovelace-ios-themes](https://github.com/basnijholt/lovelace-ios-themes).
[^2]: Supported languages: `bg`, `ca`, `cs` `da`, `de`, `el`,`en`, `es`, `et`, `fi`, `fr`, `he`, `hu`, `it`, `ko`, `nb`, `nl`, `pl`, `pt`, `pt-BR`, `ro`, `ru`, `sk`, `sl`, `sv`, `th`, `uk`, `vi`, `zh-CN`, `zh-TW`
