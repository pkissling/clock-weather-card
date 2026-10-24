# clock-weather-card v3.0.0

v3 is a ground-up rewrite. The fixed today/forecast layout is replaced by three independent sections - a composable `header`, a horizontally scrolling `forecast_strip` and a vertical `forecast_list` - each configurable on its own, and every option can now be set in the visual editor. **Most v2 options moved or were removed, so I recommend starting from scratch: delete your existing card, add it again and configure it in the visual editor.** The defaults cover most v2 setups, and a fresh config avoids leftover v2 options that v3 silently ignores. To convert an existing config by hand, see the [migration guide](#migration-guide-v2--v3).

Thanks to everyone who tested the betas and reported issues - a lot of what follows came from your feedback.

## ⚠️ Breaking changes

- **Config restructured into sections.** Almost all v2 top-level options moved under `sections.header`, `sections.forecast_strip` or `sections.forecast_list`, or are replaced by header segments. Removed v2 options are silently ignored, so an un-migrated config still renders - just not the way you configured it. See the [migration guide](#migration-guide-v2--v3).
- **New forecast strip shown by default.** v3 adds an hourly `forecast_strip` between the header and the forecast list. Set `sections.forecast_strip.hide: true` to get the v2 layout back.
- **New default header.** The large weather icon sits next to three rows: current temperature and weather state, a large centered clock, and the date. Humidity, apparent temperature and AQI are no longer built in - add them as segments.
- **`time_format` removed.** Use `time_pattern` on a `time` segment: `HH:mm` / `HH:mm:ss` for 24-hour, `hh:mm a` / `h:mm a` for 12-hour ([Luxon tokens](https://moment.github.io/luxon/#/formatting?id=table-of-tokens)).
- **Time and date follow your locale and Home Assistant profile.** When omitted, time and date use the localized Luxon tokens `t` / `DDD`, and times follow the 12/24-hour setting of your Home Assistant profile - e.g. `15:27` and `27 April 2026` for `en-GB`, `3:27 PM` and `April 27, 2026` for `en-US`. v2 rendered a fixed `HH:mm` / `ccc, d.MM.yy`. Set the pattern explicitly to keep the old look.
- **Time zone follows your Home Assistant profile; `use_browser_time` removed.** When `time_zone` is unset, the card uses the time zone from the Localization settings of your Home Assistant user profile, like the rest of the Home Assistant UI. Home Assistant defaults this to your browser's time zone, while v2 used the server's. So on a device in a different time zone than the server, the card now shows the device's local time. To keep the v2 behavior, set `time_zone` or switch the profile setting to the server time zone.
- **Locale names for Serbian (Latin) and Chinese changed.** The translation files now match the language codes Home Assistant sends (`sr-latn`, `zh-hans`, `zh-hant`). A card config with `locale: zh-cn`, `zh-tw` or `srlatn` no longer finds these translations - use `zh-hans`, `zh-hant` or `sr-latn` instead. Without an explicit `locale`, Serbian (Latin) and Chinese now work out of the box (see bug fixes).
- **Invalid config values now raise a card error** naming the offending option and the expected value, instead of rendering silently wrong.

## ✨ New features

- **Visual editor** - set up every option in the dashboard's visual card editor, from sections and forecast settings to header rows, segments and bar colors (with a native color picker). No YAML required; the code editor stays available for those who prefer it.
- **Composable header** - build the header from `rows` of `segments`: `time`, `date`, `weather` (state or any attribute), `entity` (any HA entity or attribute), `icon` (MDI), `template` (any Home Assistant [template](https://www.home-assistant.io/docs/configuration/templating/), live-updating), `text` and `spacer` to push groups apart. Each row can set its own `font_size` and `alignment` (`left`, `center`, `right`).
- **Forecast strip** - a horizontally scrolling strip of upcoming hours or days, with an extra attribute row (precipitation probability by default) and sunrise/sunset columns in hourly mode (`hide_sunrise_sunset` to turn them off).
- **Hourly or daily, per section** - `forecast_type` is set independently on `forecast_strip` and `forecast_list`, e.g. a daily strip above an hourly list.
- **Configurable hour labels** - hourly forecasts are labeled with the localized time (e.g. `18:00` or `6:00 PM`); `time_pattern` on `forecast_strip` and `forecast_list` accepts any Luxon format, e.g. `H` for the bare hour.
- **Any forecast attribute** - show `wind_speed`, `humidity`, `uv_index` or any other numeric forecast attribute in the strip (`attribute`, `attribute_icon`, `attribute_unit`, `attribute_color`) or as bars in the list.
- **Custom bar colors** - `forecast_list.gradient` maps values to colors for the temperature (or attribute) bars.
- **Tunable forecast list** - `row_height`, `bar_thickness` and `hide_current_temp_indicator`.
- **`temperature_sensor` everywhere** - the sensor now replaces the current temperature in the header, the forecast list's current temperature dot and the strip's "Now" entry.
- **Meteocons v3** - all weather icons are now based on [Meteocons](https://github.com/basmilius/meteocons) v3, with redrawn icons for every weather state. Huge thanks to [Bas Milius](https://github.com/basmilius) for creating and maintaining these beautiful icons!
- **Two new icon styles** - `flat` and `monochrome` join `line` and `fill`. `weather_icon_type` can be overridden per section.
- **Animated icons per section** - `animated_icons` on each section (on for the header, off for the forecast sections by default).
- **Header icon size** - `sections.header.weather_icon_size`; by default the icon matches the height of the header rows.
- **`temperature_unit`** - show all temperatures in `celsius` or `fahrenheit`, converting the weather entity's values, `temperature_sensor` and `°C`/`°F` entity segments.
- **Number format and display precision from Home Assistant** - temperatures, attribute values and numeric entity states use the number format set in your Home Assistant profile, and sensors are rounded to the display precision set on the entity.
- **Units everywhere** - known weather attributes get their unit automatically; override with `unit` or `unit_attribute` on `weather` and `entity` segments.
- **`tap_action`** - any Home Assistant [action](https://www.home-assistant.io/dashboards/actions/) (`navigate`, `url`, `more-info`, `perform-action`, …). Defaults to `more-info`; `none` makes the card not clickable.
- **Per-section weather entity** - `forecast_strip` and `forecast_list` accept their own `weather_entity`.
- **Sections and masonry layout** - the card reports its size to Home Assistant, so it gets a sensible default size in sections views and is placed correctly in masonry views.
- **RTL support** for right-to-left languages.

## 🚀 Improvements

- **Smaller bundle** - weather icons ship as plain SVG files and load on demand; the bundle is minified. Keeps low-power devices (e.g. NSPanel Pro) responsive.
- **Isolated re-renders** - the single 800-line v2 component is split into ~15 sub-components, so a clock tick only re-renders the time segment, and forecast sections skip re-rendering on unrelated Home Assistant updates.
- **Loading placeholders** - forecast sections show skeleton placeholders until the forecast arrives instead of an empty card.
- **Better contrast on light themes** - weather icons are outlined so near-white clouds stay visible, and the forecast bar track is tinted with the theme's secondary text color.
- **Long labels are truncated** - long day and time labels in the forecast sections end in an ellipsis (full text on hover) instead of breaking the layout.
- **Clearer errors** - config errors use Home Assistant's error card with a formatted, wrapping message; missing entity data logs a warning instead of failing silently.

## 🐛 Bug fixes

- **Serbian (Latin) and Chinese translations** - Serbian (Latin) showed Cyrillic text and Chinese fell back to English, because the translation files didn't match the language codes Home Assistant sends.
- **Clear sky wording** - `sunny` shows "Sunny" by day and "Clear" at night.
- **Forecast after a Home Assistant restart** - a forecast subscription rejected while the weather integration is still loading is retried, instead of leaving the forecast empty until the page is reloaded. The card also recovers when the weather entity is temporarily unavailable.
- **Card loaded twice** - loading the card bundle twice (e.g. via HACS and a manual resource) no longer breaks the dashboard.
- **Icon for exceptional weather** - the `exceptional` state now shows a weather alert icon (cloud with a warning triangle) instead of a hurricane, and `windy-exceptional` a wind alert icon instead of a windsock ([#49](https://github.com/pkissling/clock-weather-card/issues/49)).
- **More fitting weather icons** - `rainy` shows a plain rain cloud instead of one with a sun or moon, `pouring` a dark heavy-rain cloud so it stands out from `rainy`, `windy` and `windy-variant` wind lines instead of a windsock, and unknown weather states a "not available" icon instead of keeping the previous icon.

## 🛠️ Developer experience

- **E2E tests against a real Home Assistant** - Playwright starts its own HA container with a mock weather integration and runs against HA stable, beta and dev; screenshot tests cover every weather state × icon style × day/night × animated/static.
- **Unit tests** with Vitest for config validation and pure logic.
- **README images rendered from config** - every card image in the README is generated from the YAML next to it, so docs and behavior can't drift apart.
- **Dev and prod side by side** - the dev build registers as `clock-weather-card-dev`, so it can run next to the released card on the same dashboard.

## Migration guide (v2 → v3)

I recommend starting from scratch (see above). If you'd rather convert an existing config by hand, use the mapping below.

### Option mapping

| v2 option | v3 replacement |
|-----------|----------------|
| `entity`, `title`, `sun_entity`, `locale`, `time_zone`, `weather_icon_type` | Unchanged (top level). `weather_icon_type` also accepts `flat` and `monochrome`; `locale` uses `sr-latn`, `zh-hans`, `zh-hant` instead of `srlatn`, `zh-cn`, `zh-tw`. |
| `temperature_sensor` | Unchanged (top level). Now also used by the forecast list's current temperature dot and the strip's "Now" entry. |
| `animated_icon` | `sections.header.animated_icons` |
| `forecast_rows` | `sections.forecast_list.count` |
| `hourly_forecast: true` | `sections.forecast_list.forecast_type: hourly` |
| `hide_today_section` | `sections.header.hide` |
| `hide_forecast_section` | `sections.forecast_list.hide` (and `sections.forecast_strip.hide` for the new strip) |
| `time_pattern` | `time_pattern` on a `time` segment |
| `time_format: 24` / `12` | `time_pattern: HH:mm` / `h:mm a` on a `time` segment, or leave it unset to follow your Home Assistant profile |
| `date_pattern` | `date_pattern` on a `date` segment |
| `hide_clock` | Custom `rows` without a `time` segment |
| `hide_date` | Custom `rows` without a `date` segment |
| `show_humidity` | `weather` segment with `attribute: humidity` |
| `humidity_sensor` | `entity` segment with `entity_id: <sensor>` |
| `apparent_sensor` | `entity` segment with `entity_id: <sensor>` (or `weather` segment with `attribute: apparent_temperature`) |
| `aqi_sensor` | `entity` segment with `entity_id: <sensor>` |
| `show_decimal` | Removed. Sensors are shown with the display precision set in Home Assistant; forecast sections use `round_temperatures`. |
| `use_browser_time` | Removed. The card follows the time zone in your Home Assistant profile (browser time by default); set `time_zone` to override it. |
| `tap_action` | Tap opens more-info by default, configurable via `tap_action`; hold and double tap are not supported. |
