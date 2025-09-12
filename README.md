# Clock Weather Card

[![HACS](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://github.com/hacs/integration)
[![Total downloads](https://img.shields.io/github/downloads/pkissling/clock-weather-card/total)](https://github.com/pkissling/clock-weather-card/releases)
[![Downloads of latest version (latest by SemVer)](https://img.shields.io/github/downloads/pkissling/clock-weather-card/latest/total?sort=semver)](https://github.com/pkissling/clock-weather-card/releases/latest)
[![Current version](https://img.shields.io/github/v/release/pkissling/clock-weather-card)](https://github.com/pkissling/clock-weather-card/releases/latest)

Welcome to Clock Weather Card! 🌤️

A beautiful and feature-rich [Home Assistant Dashboard Card](https://www.home-assistant.io/dashboards/) that elegantly displays the current date, time, and weather forecast. Available through the [Home Assistant Community Store](https://hacs.xyz), this card brings a modern and informative weather display to your Home Assistant dashboard.

![Clock Weather Card](.github/assets/card.gif)
[^1]

## ✨ Features

- 🕒 Real-time clock display with customizable formats
- 🌤️ Beautiful weather icons with optional animations
- 📅 Current date display with flexible formatting
- 📊 Temperature range visualization
- 🌡️ Support for current temperature, humidity, and "feels like" temperature
- 🌍 Multi-language support
- ⚡ Highly customizable appearance and layout
- 🔄 Support for both daily and hourly forecasts
- 🌙 Automatic day/night icon switching
- 📱 Responsive design that works on all devices

## 🎨 Customization

The card is highly customizable to match your dashboard's style and your preferences. You can:

- Choose between line or filled weather icons
- Enable/disable animations
- Customize the number of forecast days
- Adjust date and time formats
- Show/hide various elements
- Configure temperature display options
- Set your preferred time zone

## 🚀 Quick Start

### Installation via HACS (Recommended)

1. Make sure you have [HACS](https://github.com/custom-components/hacs) installed
2. Search for "Clock Weather Card" in HACS
3. Click "Download"
4. Add the resource to your Lovelace configuration
5. Add the card to your dashboard

### Manual Installation

1. Download the [latest release](https://www.github.com/pkissling/clock-weather-card/releases/latest/download/clock-weather-card.js)
2. Place the file in your `config/www` folder
3. Add the resource to your Lovelace configuration
4. Add the card to your dashboard

Credits go to [basmilius](https://github.com/basmilius) for the awesome [weather icons](https://github.com/basmilius/weather-icons).

## FAQ

- [Why don't I see the current day in my weather forecast?](#why-dont-i-see-the-current-day-in-my-weather-forecast)
- [What does the card actually display?](#what-does-the-card-actually-display)

### Why don't I see the current day in my weather forecast?

Your weather provider may not provide today's weather as part of their weather forecast. You may consider switching to a different weather provider.
[OpenWeatherMap](https://www.home-assistant.io/integrations/openweathermap/) is one of the weather integrations providing today's weather.

### What does the card actually display?

![image](https://user-images.githubusercontent.com/33731393/221779555-c2c25e12-4ff0-4c61-8fd7-94d5b1b214d3.png)

The bars represent the temperature range for a given day.
In the above image, the 9° on Thursday represents the low across all of the forecast days and the 21° represents the highs (i.e. all bars are from 9° to 21°).
The colored portion of the bar represents the range of temperatures that are forecast for that day (so 12° to 21° on Monday).
The circle represents the current temperature (16° or roughly midway between 12° and 21° in your case).

_Thanks to @deprecatedcoder for this text from [#143](https://github.com/pkissling/clock-weather-card/issues/143)_

The basic idea of the forecast bars is to be able to understand the weather trend for the upcoming days in a single glance.

## 🌐 Contributing Translations

- Where to edit: translation files live in [src/locales/](/src/locales).
- Source of truth: [en.json](/src/locales/en.json) is the source file for all other languages.
- Naming: filenames are locale codes in lowercase; use hyphens for region/script variants (e.g., `de.json`, `pt-br.json`, `sr-latn.json`, `zh-cn.json`).
- Missing translation fallback: if a key is missing in a language, the card falls back to English.
- Missing language fallback: if an entire language is missing, the card falls back to English.

Update an existing language

- Open the relevant file in `src/locales/` (e.g., `de.json`).
- Translate values only; do not change keys.
- If `en.json` has new keys, add them and translate.
- Ensure the JSON is valid (no trailing commas, proper quotes).

Add a new language

- Copy `src/locales/en.json` to `src/locales/<locale>.json` (e.g., `src/locales/it.json`).
- Translate values; keep the key structure identical to `en.json`.
- Choose a correct locale code for the filename (lowercase, hyphenated for variants).

Submitting your changes

- Fork the repository and create a branch.
- Commit your changes with a clear message (mention the locale).
- Open a Pull Request describing what you updated/added.

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, improving documentation, or adding new features, your help is appreciated. Please feel free to:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Credits to [basmilius](https://github.com/basmilius) for the awesome [weather icons](https://github.com/basmilius/weather-icons)
- Thanks to all contributors who have helped shape this project
- Special thanks to the Home Assistant community for their support and feedback

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
      _(Alternatively go to Settings -> Dashboards -> Resources -> Add Resource)_

      ```yaml
      URL: /hacsfiles/clock-weather-card/clock-weather-card.js
      Type: JavaScript Module
      ```

4. Restart Home Assistant.
5. Add [configuration](#configuration) for the card in your `ui-lovelace.yaml` or via the UI.

## Configuration

### Minimal configuration

```yaml
type: custom:clock-weather-card
entity: weather.home  # replace with your weather providers's entity id
```

### Full configuration

```yaml
type: custom:clock-weather-card
entity: weather.home  # replace with your weather providers's entity id
title: Home
sun_entity: sun.sun
temperature_sensor: sensor.outdoor_temp
humidity_sensor: sensor.outdoor_humidity
weather_icon_type: line
animated_icon: true
forecast_rows: 5
locale: en-GB
time_pattern: HH:mm
time_format: 24
date_pattern: ccc, d.MM.yy
hide_today_section: false
hide_forecast_section: false
show_humidity: false
hide_clock: false
hide_date: false
hourly_forecast: false
use_browser_time: false
time_zone: null
show_decimal: false
apparent_sensor: sensor.real_feel_temperature
aqi_sensor: sensor.air_quality_index
```

### Options

| Name                  | Type             | Requirement  | Description                                                                                                                                                                                                                       | Default   |
| --------------------- | ---------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| type                  | string           | **Required** | `custom:clock-weather-card`                                                                                                                                                                                                       |           |
| entity                | string           | **Required** | ID of the weather entity                                                                                                                                                                                                          |           |
| title                 | string           | **Optional** | Title of the card                                                                                                                                                                                                                 | `''`      |
| sun_entity            | boolean          | **Optional** | ID of the sun entity. Used to determine whether to show a day or night icon. If sun integration is not enabled, day icon will be shown                                                                                            | `sun.sun` |
| temperature_sensor    | string           | **Optional** | ID of the temperature sensor entity. Used to show the current temperature based on a sensor value instead of the weather forecast                                                                                                 | `''`      |
| humidity_sensor       | string           | **Optional** | ID of the humidity sensor entity. Used to show the current humidity based on a sensor value, if `show_humidity` is set to `true`                                                                                                  | `''`      |
| weather_icon_type     | `line` \| `fill` | **Optional** | Appearance of the large weather icon                                                                                                                                                                                              | `line`    |
| animated_icon         | boolean          | **Optional** | Whether the large weather icon should be animated                                                                                                                                                                                 | `true`    |
| forecast_rows         | number           | **Optional** | The amount of weather forecast rows to show. Depending on `hourly_forecast` each row either corresponds to a day or an hour                                                                                                       | `5`       |
| locale                | string[^2]       | **Optional** | Language to use for language specific text and date/time formatting. If not provided, falls back to the locale set in HA or, if not set in HA, to `en-GB`                                                                         | `en-GB`   |
| time_format           | `24` \| `12`     | **Optional** | Format used to display the time. If not provided, falls back to the default time format of the configured `locale`.  This option is ignored if `time_pattern` is set.                                                             | `24`      |
| time_pattern          | string           | **Optional** | Pattern to use for time formatting. See [luxon](https://moment.github.io/luxon/#/formatting?id=table-of-tokens) for valid tokens. If not provided, falls back to time_format option.                                              | `null`    |
| date_pattern          | string           | **Optional** | Pattern to use for date formatting. If not provided, falls back to a localized default date formatting. See [luxon](https://moment.github.io/luxon/#/formatting?id=table-of-tokens) for valid tokens                              | `D`       |
| show_humidity         | boolean          | **Optional** | Shows the humidity in the today section. Reads the value from `humidity_sensor`, if provided, otherwise from the `humidity` attribute of the configured weather `entity`                                                           | `false`   |
| hide_today_section    | boolean          | **Optional** | Hides the cards today section (upper section), containing the large weather icon, clock and current date                                                                                                                          | `false`   |
| hide_forecast_section | boolean          | **Optional** | Hides the cards forecast section (lower section),containing the weather forecast                                                                                                                                                  | `false`   |
| hide_clock            | boolean          | **Optional** | Hides the clock from the today section and prominently displays the current temperature instead                                                                                                                                   | `false`   |
| hide_date             | boolean          | **Optional** | Hides the date from the today section                                                                                                                                                                                             | `false`   |
| hourly_forecast       | boolean          | **Optional** | Displays an hourly forecast instead of daily                                                                                                                                                                                      | `false`   |
| use_browser_time      | boolean          | **Optional** | Uses the time from your browser to indicate the current time. If not provided, uses the [time_zone](https://www.home-assistant.io/blog/2015/05/09/utc-time-zone-awareness/#setting-up-your-time-zone) configured in HA            | `false`   |
| time_zone             | string           | **Optional** | Uses the given [time zone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) to indicate the current date and time. If not provided, uses the time zone configured in HA                                              | `null`    |
| show_decimal          | boolean          | **Optional** | Displays main temperature without rounding                                                                                                                                                                                        | `false`   |
| apparent_sensor       | string           | **Optional** | ID of the apparent temperature sensor entity. It is used to show the apparent temperature based on a sensor and will only show it if value is provided.                                                                           | `''`      |
| aqi_sensor       | string           | **Optional** | ID of the Air Quality Index sensor entity. It is used to show the AQI based on a sensor and will only show it if value is provided.                                                                           | `''`      |

## Development

When developing locally, this repository exposes a development variant of the card so you can test changes without affecting the production card.

- Production card: `clock-weather-card`
- Development card: `clock-weather-card-dev`

The `-dev` prefix lets you place both cards side-by-side on the same dashboard.

### Run the dev server

```sh
yarn install
yarn dev
```

This starts a Vite dev server on port `5173` that serves the development build of the card.

### Add the dev card to Home Assistant

1. In Home Assistant, go to Settings → Dashboards → Resources and add a new resource with:
   - URL: `http://<your-dev-ip>:5173/src/clock-weather-card-dev.js`
   - Resource type: JavaScript Module

2. Edit a dashboard/view and add the dev card. For YAML mode:

```yaml
type: custom:clock-weather-card-dev
entity: weather.home  # replace with your weather providers's entity id
```

Notes:

- Replace `<your-dev-ip>` with the IP/hostname where the dev server runs (port 5173).
- Ensure Home Assistant can reach that IP (e.g., use your machine’s LAN IP if HA runs on another host or container).

## Footnotes

[^1]: Theme used: [lovelace-ios-themes](https://github.com/basnijholt/lovelace-ios-themes).
[^2]: Supported languages correspond to the files in `src/locales/`. See the list here: [src/locales](src/locales) (filenames are the locale codes).
