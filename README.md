# Clock Weather Card

[![HACS](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://github.com/hacs/integration)
[![Total downloads](https://img.shields.io/github/downloads/pkissling/clock-weather-card/total)](https://github.com/pkissling/clock-weather-card/releases)
[![Downloads of latest version (latest by SemVer)](https://img.shields.io/github/downloads/pkissling/clock-weather-card/latest/total?sort=semver)](https://github.com/pkissling/clock-weather-card/releases/latest)
[![Current version](https://img.shields.io/github/v/release/pkissling/clock-weather-card)](https://github.com/pkissling/clock-weather-card/releases/latest)

A [Home Assistant Dashboard Card](https://www.home-assistant.io/dashboards/) available through the [Home Assistant Community Store](https://hacs.xyz) showing the current date, time and a weather forecast.

![Clock Weather Card](.github/assets/card.gif)
[^1]

Credits go to [basmilius](https://github.com/basmilius) for the awesome [weather icons](https://github.com/basmilius/meteocons) (MIT License).

## Migrating from v2 to v3

<!-- TODO: Document migration guide for v2 to v3 -->

## FAQ

<details>
<summary>Why don't I see the current day in my weather forecast?</summary>

Some weather providers do not include today's weather in their forecast data. If this happens, try switching to a different provider.
[Open Meteo](https://www.home-assistant.io/integrations/open_meteo/) is the default weather integration in Home Assistant and includes today's weather.

</details>

<details>
<summary>What do the forecast bars represent?</summary>

![image](https://user-images.githubusercontent.com/33731393/221779555-c2c25e12-4ff0-4c61-8fd7-94d5b1b214d3.png)

The bars visualize the temperature range for each day relative to the overall forecast range.

- The full bar spans the overall low to overall high across all forecast days (9° to 21° in the example above).
- The colored portion represents the temperature range for that specific day (e.g. 12° to 21° on Monday).
- The circle marks the current temperature (e.g. 16°).

This makes it easy to see the weather trend for the upcoming days at a glance.

_Thanks to @deprecatedcoder for this explanation from [#143](https://github.com/pkissling/clock-weather-card/issues/143)._

</details>

## Installation

### HACS (recommended)

1. Make sure [HACS](https://hacs.xyz) is installed.
2. Search for **Clock Weather Card** in HACS and install it.
3. Add the resource depending on how you manage Lovelace resources:

   **Via UI (recommended):** Go to _Settings > Dashboards > Resources > Add Resource_ or use [![My Home Assistant](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_resources) and add:

   ```
   URL: /hacsfiles/clock-weather-card/clock-weather-card.js
   Type: JavaScript Module
   ```

   **Via YAML:** Add to your `ui-lovelace.yaml`:

   ```yaml
   resources:
     - url: /hacsfiles/clock-weather-card/clock-weather-card.js
       type: module
   ```

4. Add the card to your dashboard (see [Configuration](#configuration)).

### Manual

1. Download `clock-weather-card.js` from the [latest release](https://www.github.com/pkissling/clock-weather-card/releases/latest).
2. Place the file in your Home Assistant `config/www` folder.
3. Add the resource to your `ui-lovelace.yaml`:

   ```yaml
   resources:
     - url: /local/clock-weather-card.js
       type: module
   ```

4. Add the card to your dashboard (see [Configuration](#configuration)).

## Configuration

### Minimal configuration

```yaml
type: custom:clock-weather-card
entity: weather.home
```

### Full configuration

```yaml
type: custom:clock-weather-card
entity: weather.home
title: Home
sun_entity: sun.sun
weather_icon_type: line
rows:
  - segments:
      - type: icon
        icon: mdi:thermometer
      - type: weather
        attribute: temperature
      - type: spacer
      - type: weather
      - type: icon
        icon: mdi:weather-partly-cloudy
  - font_size: 4rem
    segments:
      - type: spacer
      - type: time
        time_pattern: HH:mm
      - type: spacer
  - segments:
      - type: spacer
      - type: icon
        icon: mdi:calendar
      - type: date
        date_pattern: EEEE, dd MMMM
      - type: spacer
```

### Card Options

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `entity` | string | **yes** | - | Entity ID of your weather provider |
| `title` | string | no | `null` | Title displayed at the top of the card |
| `sun_entity` | string | no | `sun.sun` | Entity ID of the sun entity, used to determine day/night icons |
| `weather_icon_type` | `fill` \| `flat` \| `line` \| `monochrome` | no | `line` | Visual style of the weather icon. Icons provided by [@meteocons/svg](https://github.com/basmilius/meteocons) |
| `rows` | list | no | See [Default Rows](#default-rows) | List of rows to display |

### Row Options

Each row is a horizontal line of segments.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `segments` | list | **yes** | - | List of segments in this row |
| `font_size` | string | no | inherited | CSS font-size (e.g. `14px`, `3rem`) |

### Segment Types

#### `time`

Displays the current time, auto-updating every second.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `type` | string | **yes** | - | `time` |
| `time_pattern` | string | no | `HH:mm:ss` | [Luxon](https://moment.github.io/luxon/#/formatting?id=table-of-tokens) time format pattern |

#### `date`

Displays the current date.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `type` | string | **yes** | - | `date` |
| `date_pattern` | string | no | `EEEE, dd MMMM yyyy` | [Luxon](https://moment.github.io/luxon/#/formatting?id=table-of-tokens) date format pattern |

#### `weather`

Displays the current weather state (localized) or a specific weather entity attribute.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `type` | string | **yes** | - | `weather` |
| `attribute` | string | no | - | Weather entity attribute (e.g. `temperature`, `humidity`). If omitted, shows the localized weather state text. |

#### `entity`

Displays a Home Assistant entity's state and unit.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `type` | string | **yes** | - | `entity` |
| `entity_id` | string | **yes** | - | Entity ID (e.g. `sensor.temperature`) |
| `attribute` | string | no | - | Entity attribute to display. If omitted, shows the entity state + unit. |

#### `icon`

Displays an MDI icon.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `type` | string | **yes** | - | `icon` |
| `icon` | string | **yes** | - | MDI icon name (e.g. `mdi:thermometer`, `mdi:calendar`) |

#### `spacer`

A flexible spacer that fills remaining horizontal space. Use spacers to control alignment within a row.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `type` | string | **yes** | - | `spacer` |

**Alignment examples using spacers:**

```yaml
# Center content
- segments:
    - type: spacer
    - type: time
    - type: spacer

# Right-align content
- segments:
    - type: spacer
    - type: time

# Space between two groups
- segments:
    - type: weather
      attribute: temperature
    - type: spacer
    - type: weather
```

### Default Rows

When no `rows` are configured, the card displays the following default layout:

```yaml
rows:
  - segments:
      - type: icon
        icon: mdi:thermometer
      - type: weather
        attribute: temperature
      - type: spacer
      - type: weather
      - type: icon
        icon: mdi:weather-partly-cloudy
  - font_size: 4rem
    segments:
      - type: spacer
      - type: time
      - type: spacer
  - segments:
      - type: spacer
      - type: icon
        icon: mdi:calendar
      - type: date
      - type: spacer
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) (for E2E tests)

### Setup

```bash
git clone https://github.com/pkissling/clock-weather-card.git
cd clock-weather-card
yarn install
```

### Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start the Vite dev server on `http://localhost:5173` |
| `yarn build` | Type-check and build the production bundle |
| `yarn lint` | Run ESLint with auto-fix |
| `yarn test:e2e` | Run Playwright E2E tests against a real HA instance |
| `yarn playwright-ui` | Open the Playwright UI for interactive test debugging |
| `yarn test:e2e:update-snapshots` | Regenerate Playwright snapshots in a Linux Docker container |

### E2E tests

E2E tests use Playwright and run the card inside a real Home Assistant Docker container. The test setup (`e2e/ha-setup.ts`) automatically:

1. Builds the card
2. Starts a Home Assistant container with the card installed
3. Completes onboarding and configures test dashboards
4. Runs the tests
5. Tears down the container

A custom `mock_weather` integration (`e2e/ha-config/custom_components/mock_weather/`) provides a controllable weather entity. Tests set weather state, forecasts, and sun position via the HA REST API before each test.

> **Note:** Docker must be running before executing `yarn test:e2e`.

<!-- TODO: Add instructions for manual testing against a local HA instance (e.g. via docker-compose with hot-reload) -->

## Contributions

### Translations

The card is available in multiple languages. Translation files are located in [`src/locales/`](src/locales/), with each language stored as a separate JSON file (e.g. `en.json`, `de.json`, `fr.json`).

The card automatically picks the language configured in your Home Assistant instance. If no matching translation is found, it falls back to English.

To add a new language or improve an existing translation:

1. **New language:** Copy `src/locales/en.json` to `src/locales/<language-code>.json` and translate the values.
2. **Update existing translation:** Edit the corresponding file in `src/locales/`.

Use lowercase [BCP 47 language tags](https://en.wikipedia.org/wiki/IETF_language_tag) for the filename (e.g. `pt-br.json`, `zh-cn.json`).

### Playwright screenshots

E2E tests run against a real Home Assistant instance via Docker. Visual regression tests use Playwright screenshots to verify the card renders correctly.

To regenerate screenshots after visual changes, either:

- **CI:** Run the **Update Playwright Snapshots** workflow from the Actions tab. It updates snapshots in separate commits on the current branch.
- **Locally:** Run `yarn test:e2e:update-snapshots` to regenerate snapshots. This builds a Docker image with the Playwright browsers and runs the tests inside it, writing updated snapshots back to `e2e/`. Requires Docker with access to the Docker socket (to spawn Home-Assistant in a dedicated Docker container).

## License

This project is licensed under the [MIT License](LICENSE.md).

## Footnotes

[^1]: Theme used: [lovelace-ios-themes](https://github.com/basnijholt/lovelace-ios-themes).
