# clock-weather-card v3.0.0

v3 is a ground-up rewrite. The fixed today/forecast layout is replaced by three independent sections - a composable `header`, a horizontally scrolling `forecast_strip` and a vertical `forecast_list` - each configurable on its own. **Most v2 options moved or were removed, so we recommend starting from scratch: delete your existing card, add it again and configure it in the visual editor.** The defaults cover most v2 setups, and a fresh config avoids leftover v2 options that v3 silently ignores. To convert an existing config by hand, see the [migration guide](#migration-guide-v2--v3).

## ⚠️ Breaking changes

- **Config restructured into sections.** Almost all v2 top-level options moved under `sections.header`, `sections.forecast_strip` or `sections.forecast_list`, or are replaced by header segments. Removed v2 options are silently ignored, so an un-migrated config still renders - just not the way you configured it. See the [migration guide](#migration-guide-v2--v3).
- **New forecast strip shown by default.** v3 adds an hourly `forecast_strip` between the header and the forecast list. Set `sections.forecast_strip.hide: true` to get the v2 layout back.
- **New default header.** The large weather icon sits next to three rows: current temperature and weather state, a large clock, and the date. Humidity, apparent temperature and AQI are no longer built in - add them as segments.
- **`time_format` removed.** Use `time_pattern` on a `time` segment: `HH:mm` / `HH:mm:ss` for 24-hour, `hh:mm a` / `h:mm a` for 12-hour ([Luxon tokens](https://moment.github.io/luxon/#/formatting?id=table-of-tokens)).
- **Default `time_pattern` / `date_pattern` are locale-aware.** When omitted, time and date use the localized Luxon tokens `t` / `DDD` - e.g. `15:27` and `27 April 2026` for `en-GB`, `3:27 PM` and `April 27, 2026` for `en-US`. v2 rendered a fixed `HH:mm` / `ccc, d.MM.yy`. Set the pattern explicitly to keep the old look.
- **`use_browser_time` removed.** The clock always uses `time_zone`, falling back to the Home Assistant time zone.
- **Tapping the card does nothing by default.** v2 opened the weather entity's more-info dialog on tap and supported undocumented `hold_action` / `double_tap_action`. Set `tap_action: { action: more-info }` to restore the tap behavior; hold and double tap are no longer supported.
- **Invalid config values now raise a card error** naming the offending option and the expected value, instead of rendering silently wrong.

## ✨ New features

- **Configuration via GUI** - set up every option in the dashboard's visual card editor, from sections and forecast settings to header rows and segments. No YAML required; the code editor stays available for those who prefer it.
- **Composable header** - build the header from `rows` of `segments`: `time`, `date`, `weather` (state or any attribute), `entity` (any HA entity or attribute), `icon` (MDI), `weather_icon` (MDI icon following the weather state), `text` and `spacer` to push groups apart. Each row can set its own `font_size` and `alignment` (`left`, `center`, `right`).
- **Forecast strip** - a horizontally scrolling strip of upcoming hours or days, with an extra attribute row (precipitation probability by default) and sunrise/sunset columns in hourly mode.
- **Hourly or daily, per section** - `forecast_type` is set independently on `forecast_strip` and `forecast_list`, e.g. a daily strip above an hourly list.
- **Any forecast attribute** - show `wind_speed`, `humidity`, `uv_index` or any other numeric forecast attribute in the strip (`attribute`, `attribute_icon`, `attribute_unit`, `attribute_color`) or as bars in the list.
- **Custom bar colors** - `forecast_list.gradient` maps values to colors for the temperature (or attribute) bars.
- **Tunable forecast list** - `row_height`, `bar_thickness` and `hide_current_temp_indicator`.
- **Meteocons v3** - all weather icons are now based on [Meteocons](https://github.com/basmilius/meteocons) v3, with redrawn icons for every weather state. Huge thanks to [Bas Milius](https://github.com/basmilius) for creating and maintaining these beautiful icons!
- **Two new icon styles** - `flat` and `monochrome` join `line` and `fill`. `weather_icon_type` can be overridden per section.
- **Animated icons per section** - `animated_icons` on each section (on for the header, off for the forecast sections by default).
- **Header icon size** - `sections.header.weather_icon_size`; by default the icon matches the height of the header rows.
- **`temperature_unit`** - show all temperatures in `celsius` or `fahrenheit`, converting the weather entity's values and `°C`/`°F` entity segments.
- **Units everywhere** - known weather attributes get their unit automatically; override with `unit` or `unit_attribute` on `weather` and `entity` segments.
- **`tap_action`** - any Home Assistant [action](https://www.home-assistant.io/dashboards/actions/) (`navigate`, `url`, `more-info`, `perform-action`, …).
- **Per-section weather entity** - `forecast_strip` and `forecast_list` accept their own `weather_entity`.
- **RTL support** support for right-to-left languages.

## 🚀 Improvements

- **Smaller bundle** - weather icons ship as plain SVG files and load on demand; the bundle is minified. Keeps low-power devices (e.g. NSPanel Pro) responsive.
- **Isolated re-renders** - the single 800-line v2 component is split into ~15 sub-components, so a clock tick only re-renders the time segment instead of the whole card.
- **Clearer errors** - config errors use Home Assistant's error card with a formatted, wrapping message; missing entity data logs a warning instead of failing silently.
- **Precipitation display** - hourly precipitation probability is rounded to 10% steps, and `0%` is shown when other columns have values.

## 🐛 Bug fixes

- **Serbian (Latin) and Chinese translations** - the translation files are renamed to match the language codes Home Assistant sends (`sr-latn`, `zh-hans`, `zh-hant`). Before, Serbian (Latin) showed Cyrillic text and Chinese fell back to English. **Breaking:** a card config with `locale: zh-cn`, `zh-tw` or `srlatn` no longer finds these translations - use `zh-hans`, `zh-hant` or `sr-latn` instead.
- **Icon for exceptional weather** - the `exceptional` state now shows a weather alert icon (cloud with a warning triangle) instead of a hurricane, and `windy-exceptional` a wind alert icon instead of a windsock ([#49](https://github.com/pkissling/clock-weather-card/issues/49)).
- **More fitting weather icons** - `rainy` shows a plain rain cloud instead of one with a sun or moon, `pouring` a dark heavy-rain cloud so it stands out from `rainy`, `windy` and `windy-variant` wind lines instead of a windsock, and unknown weather states a "not available" icon instead of keeping the previous icon.

## 🛠️ Developer experience

- **E2E tests against a real Home Assistant** - Playwright starts its own HA container with a mock weather integration; screenshot tests cover every weather state × icon style × day/night × animated/static.
- **Unit tests** with Vitest for config validation and pure logic.
- **Dev and prod side by side** - the dev build registers as `clock-weather-card-dev`, so it can run next to the released card on the same dashboard.

## Migration guide (v2 → v3)

We recommend starting from scratch (see above). If you'd rather convert an existing config by hand, use the mapping below.

### Option mapping

| v2 option | v3 replacement |
|-----------|----------------|
| `entity`, `title`, `sun_entity`, `locale`, `time_zone`, `weather_icon_type` | Unchanged (top level). `weather_icon_type` also accepts `flat` and `monochrome`. |
| `animated_icon` | `sections.header.animated_icons` |
| `forecast_rows` | `sections.forecast_list.count` |
| `hourly_forecast: true` | `sections.forecast_list.forecast_type: hourly` |
| `hide_today_section` | `sections.header.hide` |
| `hide_forecast_section` | `sections.forecast_list.hide` (and `sections.forecast_strip.hide` for the new strip) |
| `time_pattern` | `time_pattern` on a `time` segment |
| `time_format: 24` / `12` | `time_pattern: HH:mm` / `h:mm a` on a `time` segment |
| `date_pattern` | `date_pattern` on a `date` segment |
| `hide_clock` | Custom `rows` without a `time` segment |
| `hide_date` | Custom `rows` without a `date` segment |
| `temperature_sensor` | `entity` segment with `entity_id: <sensor>` |
| `show_humidity` | `weather` segment with `attribute: humidity` |
| `humidity_sensor` | `entity` segment with `entity_id: <sensor>` |
| `apparent_sensor` | `entity` segment with `entity_id: <sensor>` (or `weather` segment with `attribute: apparent_temperature`) |
| `aqi_sensor` | `entity` segment with `entity_id: <sensor>` |
| `show_decimal` | Removed. Header segments show the value as provided by the entity; forecast sections use `round_temperatures`. |
| `use_browser_time` | Removed. Set `time_zone` if the HA time zone isn't the one you want. |
| tap / `hold_action` / `double_tap_action` | `tap_action: { action: more-info }`; hold and double tap are not supported. |
