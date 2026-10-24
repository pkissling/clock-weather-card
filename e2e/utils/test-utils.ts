import { randomUUID } from 'node:crypto'

import { expect, type Page } from '@playwright/test'
import type { HomeAssistant } from 'custom-card-helpers'
import { parse as parseYaml } from 'yaml'

import type { ClockWeatherCardConfig, DailyWeatherForecast, WeatherForecast } from '../../src/types'
import { WeatherEntityFeature } from '../../src/types'
import haApi from './ha-api'
import { TEST_DASHBOARD } from './ha-setup'

const WEATHER_ENTITY = 'weather.mock_weather'
const SECONDARY_WEATHER_ENTITY = 'weather.mock_weather_2'
const MOCK_SENSOR = 'sensor.mock_sensor'
const SYNC_ENTITY = 'sensor.e2e_sync'
const STALE_ATTRIBUTE = 'data-e2e-stale'

const DEFAULT_SUPPORTED_FEATURES: WeatherEntityFeature[] = [
  WeatherEntityFeature.FORECAST_DAILY,
  WeatherEntityFeature.FORECAST_HOURLY,
]

type MockWeather = {
  state?: string
  temperature?: number
  temperatureUnit?: '°C' | '°F'
  humidity?: number
  dew_point?: number
  extra_attributes?: Record<string, unknown>
  forecast_daily?: DailyWeatherForecast[]
  forecast_hourly?: WeatherForecast[]
  supportedFeatures?: WeatherEntityFeature[]
}

export type MockEntity = {
  state: string | number
  attributes?: Record<string, unknown>
  /** Only for `sensor.mock_sensor`, the one entity with a registry entry. */
  displayPrecision?: number
}

export type MockOptions = undefined | {
  weather?: MockWeather
  /** State of `weather.mock_weather_2`, for sections with their own `weather_entity`. */
  secondaryWeather?: MockWeather
  /** Further entities; those of a previous setup that are missing here are removed. */
  entities?: Record<string, MockEntity>
  sun?: {
    state?: 'above_horizon' | 'below_horizon'
    attributes?: {
      next_rising?: string
      next_setting?: string
    }
  }
  cardConfig?: string | Record<string, unknown> | null
  date?: Date
  language?: string
  timeFormat?: '12' | '24' | 'language' | 'system'
  numberFormat?: string
  timeZone?: string
  /** The user's profile time zone setting: the browser's zone (`local`, HA's default) or HA's (`server`). Defaults to `server` when `timeZone` is set. */
  userTimeZone?: 'local' | 'server'
  unitSystem?: 'metric' | 'us_customary'
  /** Name of a theme in the HA config's `themes/` directory, applied to the dashboard view. */
  theme?: string
  /** Icons that must finish loading before setup completes (default 1). */
  expectedIcons?: number
  /** Holds back forecast pushes until the promise settles. Needs `test.use({ freshPage: true })` so no cached forecast is reused. */
  delayForecast?: Promise<void>
}

const DEFAULT_CARD_CONFIG = `
entity: ${WEATHER_ENTITY}
`

export const DEFAULT_DATE = new Date('2025-09-14T08:20:59+00:00')

// The `datetime`/`condition` computed by the series builder win over anything `entry` returns,
// so callers can feed whole row records without accidentally overriding the schedule.
const forecastSeries = <T extends object>(
  startMs: number,
  stepMs: number,
  conditions: readonly string[],
  entry: (index: number) => T,
): (T & { datetime: string, condition: string })[] =>
    conditions.map((condition, i) => ({
      ...entry(i),
      datetime: new Date(startMs + i * stepMs)
        .toISOString(),
      condition,
    }))

// One entry per condition, daily from midnight UTC of `now`'s date, so today is the first row
// regardless of when the test runs.
export const dailyForecast = (
  now: Date,
  conditions: readonly string[],
  entry: (index: number) => Omit<DailyWeatherForecast, 'datetime' | 'condition'>,
): DailyWeatherForecast[] =>
  forecastSeries(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
    24 * 60 * 60 * 1000,
    conditions,
    entry,
  )

// Default daily fixture: comfortably more entries than the default `rows` cap (5), so row-count
// behavior is driven by the config knob, not by fixture length. Conditions/temps cover the
// visual variants the section needs to render.
const DEFAULT_DAILY_ROWS = [
  { condition: 'sunny', templow: 15, temperature: 24, precipitation_probability: 10, aqi: 42, wind_speed: 8 },
  { condition: 'partlycloudy', templow: 13, temperature: 22, precipitation_probability: 20, aqi: 35, wind_speed: 14 },
  { condition: 'cloudy', templow: 12, temperature: 20, precipitation_probability: 40, aqi: 28, wind_speed: 22 },
  { condition: 'rainy', templow: 10, temperature: 18, precipitation_probability: 80, aqi: 18, wind_speed: 31 },
  { condition: 'sunny', templow: 14, temperature: 23, precipitation_probability: 5, aqi: 55, wind_speed: 11 },
  { condition: 'partlycloudy', templow: 12, temperature: 21, precipitation_probability: 15, aqi: 61, wind_speed: 17 },
  { condition: 'cloudy', templow: 11, temperature: 19, precipitation_probability: 30, aqi: 47, wind_speed: 25 },
  { condition: 'rainy', templow: 9, temperature: 17, precipitation_probability: 70, aqi: 24, wind_speed: 28 },
  { condition: 'sunny', templow: 13, temperature: 22, precipitation_probability: 10, aqi: 39, wind_speed: 9 },
  { condition: 'partlycloudy', templow: 14, temperature: 24, precipitation_probability: 20, aqi: 44, wind_speed: 12 },
]

const defaultForecastDaily = (now: Date): DailyWeatherForecast[] =>
  dailyForecast(now, DEFAULT_DAILY_ROWS.map(r => r.condition), i => DEFAULT_DAILY_ROWS[i])

// One entry per condition, hourly from the hour boundary just before `now` ("Now" column).
export const hourlyForecast = (
  now: Date,
  conditions: readonly string[],
  entry: (index: number) => Omit<WeatherForecast, 'datetime' | 'condition'>,
): WeatherForecast[] =>
  forecastSeries(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0),
    60 * 60 * 1000,
    conditions,
    entry,
  )

// 24 hourly entries. All carry precipitation probability > 0 except the 2nd and 3rd,
// which exercise the "non-zero alongside zero" rendering path.
const defaultForecastHourly = (now: Date): WeatherForecast[] =>
  hourlyForecast(
    now,
    ['sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'rainy', 'rainy', 'clear-night', 'clear-night', 'clear-night', 'clear-night', 'clear-night', 'clear-night', 'clear-night', 'sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'rainy', 'cloudy', 'partlycloudy'],
    i => ({
      temperature: 22 - Math.abs(i - 4) % 14,
      precipitation_probability: i === 1 || i === 2 ? 0 : (i >= 6 && i <= 8 ? 60 : 20),
    }),
  )

const mockWeatherData = (weather: MockWeather | undefined, date: Date): Record<string, unknown> => ({
  condition: weather?.state ?? 'sunny',
  temperature: weather?.temperature ?? 21,
  temperature_unit: weather?.temperatureUnit ?? '°C',
  humidity: weather?.humidity ?? 50,
  dew_point: weather?.dew_point ?? null,
  extra_attributes: weather?.extra_attributes ?? {},
  forecast_daily: weather?.forecast_daily ?? defaultForecastDaily(date),
  forecast_hourly: weather?.forecast_hourly ?? defaultForecastHourly(date),
  supported_features: (weather?.supportedFeatures ?? DEFAULT_SUPPORTED_FEATURES)
    .reduce((acc, f) => acc | f, 0),
})

const setEntity = async (entityId: string, { state, attributes = {}, displayPrecision }: MockEntity): Promise<void> => {
  if (entityId !== MOCK_SENSOR) {
    if (displayPrecision !== undefined) throw new Error(`displayPrecision needs a registry entry, which only ${MOCK_SENSOR} has`)
    return haApi.setEntityState(entityId, String(state), attributes)
  }
  await Promise.all([
    haApi.setMockSensor(entityId, state, attributes.unit_of_measurement as string | undefined),
    haApi.setDisplayPrecision(entityId, displayPrecision ?? null),
  ])
}

const removeEntity = async (entityId: string): Promise<void> => {
  if (entityId !== MOCK_SENSOR) return haApi.removeEntityState(entityId)
  await Promise.all([haApi.setMockSensor(entityId, null), haApi.setDisplayPrecision(entityId, null)])
}

let previousEntities: string[] = []

export const setupCard = async (page: Page, opts: MockOptions): Promise<void> => {
  // Parse YAML card config, merging with defaults
  const defaults = opts?.cardConfig === null ? {} : parseYaml(DEFAULT_CARD_CONFIG) as ClockWeatherCardConfig
  const overrides = typeof opts?.cardConfig === 'string' ? parseYaml(opts.cardConfig) as Partial<ClockWeatherCardConfig> : opts?.cardConfig ?? {}
  const cardConfig = { ...defaults, ...overrides }
  const date = opts?.date ?? DEFAULT_DATE

  const sunState = opts?.sun?.state ?? 'above_horizon'
  const language = opts?.language ?? 'en-GB'
  const timeFormat = opts?.timeFormat ?? '24'
  const numberFormat = opts?.numberFormat ?? 'language'
  const timeZone = opts?.timeZone ?? 'Europe/Berlin'
  // HA defaults the profile to the browser's zone, but a test that picks HA's zone wants it rendered.
  const userTimeZone = opts?.userTimeZone ?? (opts?.timeZone ? 'server' : 'local')
  const haTemperatureUnit = opts?.unitSystem === 'us_customary' ? '°F' : '°C'
  const entities = opts?.entities ?? {}

  // HA replaces the card element on every dashboard save, so a fresh element proves the new config landed.
  await page.locator('clock-weather-card, hui-error-card')
    .evaluateAll((els, attribute) => els.forEach(el => el.setAttribute(attribute, '')), STALE_ATTRIBUTE)

  // The dashboard save below mounts a new card that reads the clock once, so the fixed time must already be in place.
  await page.clock.setFixedTime(date)
  // Independent state writes - run concurrently.
  await Promise.all([
    haApi.setDashboardConfig(TEST_DASHBOARD, cardConfig, opts?.theme),
    haApi.setMockWeather({ ...mockWeatherData(opts?.weather, date), hold_forecast: opts?.delayForecast !== undefined }),
    haApi.setMockWeather({ ...mockWeatherData(opts?.secondaryWeather, date), entity_id: SECONDARY_WEATHER_ENTITY }),
    ...Object.entries(entities)
      .map(([entityId, entity]) => setEntity(entityId, entity)),
    ...previousEntities.filter(entityId => !(entityId in entities))
      .map(removeEntity),
    haApi.setEntityState('sun.sun', sunState, {
      elevation: sunState === 'below_horizon' ? -10 : 30,
      ...(opts?.sun?.attributes ?? {}),
    }),
    haApi.setLanguage(language, timeFormat, numberFormat, userTimeZone),
    haApi.setTimeZone(timeZone),
    haApi.setUnitSystem(opts?.unitSystem ?? 'metric'),
  ])
  previousEntities = Object.keys(entities)
  void opts?.delayForecast?.then(() => haApi.setMockWeather({ hold_forecast: false }))
  // HA pushes events to the browser in order, so once the card sees this token it has every update above.
  const syncToken = randomUUID()
  await haApi.setEntityState(SYNC_ENTITY, syncToken)

  // Skip goto on follow-up calls so HA's live WS push hits the mounted card without a reload.
  if (!page.url()
    .includes(`/${TEST_DASHBOARD}/`)) {
    await page.goto(`/${TEST_DASHBOARD}/0`)
  }

  // Either the card itself, or HA's hui-error-card wrapper if setConfig threw.
  const card = page.locator(`clock-weather-card:not([${STALE_ATTRIBUTE}]), hui-error-card:not([${STALE_ATTRIBUTE}])`)
    .first()
  await card.waitFor({ state: 'visible' })
  // Language, time zone and unit system reach the frontend via separate subscriptions, so the sync token alone doesn't cover them on a reused page.
  const expected = { entity: SYNC_ENTITY, token: syncToken, language, timeFormat, numberFormat, timeZone, userTimeZone, temperatureUnit: haTemperatureUnit }
  await expect
    .poll(() => card.evaluate((el, { entity, token, language, timeFormat, numberFormat, timeZone, userTimeZone, temperatureUnit }) => {
      if (el.localName === 'hui-error-card') return true
      const hass = (el as unknown as { hass?: HomeAssistant }).hass
      return hass?.states[entity]?.state === token && hass.language === language && hass.locale.time_format === timeFormat
        && hass.locale.number_format === numberFormat && hass.config.time_zone === timeZone
        && (hass.locale as { time_zone?: string }).time_zone === userTimeZone
        && hass.config.unit_system.temperature === temperatureUnit
    }, expected))
    .toBe(true)
  await expect(card.locator('clock-weather-card-forecast-list:not([data-loaded]), clock-weather-card-forecast-strip:not([data-loaded])'))
    .toHaveCount(0)

  await waitForIconsSettled(page, opts?.expectedIcons ?? 1)
}

async function waitForIconsSettled (page: Page, minIcons: number): Promise<void> {
  // A config error renders an error card and no icons at all - pass in that case.
  await expect
    .poll(async () => {
      const total = await page.locator('clock-weather-card-icon')
        .count()
      if (total === 0) {
        return await page.locator('hui-error-card, clock-weather-card-error')
          .count() > 0
      }
      const settled = await page.locator('clock-weather-card-icon[data-settled]')
        .count()
      return total >= minIcons && settled === total
    }, { timeout: 15_000 })
    .toBe(true)
}
