import { expect, type Page } from '@playwright/test'
import { parse as parseYaml } from 'yaml'

import type { ClockWeatherCardConfig, WeatherForecast } from '../../src/types'
import api from './ha-api'
import { TEST_DASHBOARD } from './ha-setup'

const WEATHER_ENTITY = 'weather.mock_weather'

// Bit values match HA's WeatherEntityFeature enum (daily=1, hourly=2, twice_daily=4).
export const SUPPORTS_DAILY_AND_HOURLY = 3

export type MockOptions = undefined | {
  weather?: {
    state?: string
    temperature?: number
    humidity?: number
    forecast_daily?: WeatherForecast[]
    forecast_hourly?: WeatherForecast[]
    supportedFeatures?: number
  }
  sun?: {
    state?: 'above_horizon' | 'below_horizon'
    attributes?: {
      elevation?: number
      next_rising?: string
      next_setting?: string
    }
  }
  cardConfig?: string | null
  date?: Date
  language?: string
  timeZone?: string
  /** Icons that must finish loading before setup completes (default 1). */
  expectedIcons?: number
}

const DEFAULT_CARD_CONFIG = `
entity: ${WEATHER_ENTITY}
`

const DEFAULT_FORECAST_DAILY: WeatherForecast[] = [
  { datetime: '2024-01-02T00:00:00+00:00', condition: 'sunny', temperature: 21, precipitation_probability: 0 },
  { datetime: '2024-01-03T00:00:00+00:00', condition: 'cloudy', temperature: 19, precipitation_probability: 30 },
]

export const DEFAULT_DATE = new Date('2025-09-14T14:20:59+00:00')

// One entry per condition, hourly from the hour boundary just before `now` ("Now" column).
export const hourlyForecast = (
  now: Date,
  conditions: readonly string[],
  entry: (index: number) => Omit<WeatherForecast, 'datetime' | 'condition'>,
): WeatherForecast[] => {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0)
  return conditions.map((condition, i) => ({
    datetime: new Date(start + i * 60 * 60 * 1000)
      .toISOString(),
    condition,
    ...entry(i),
  }))
}

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

export const setupCard = async (page: Page, opts: MockOptions): Promise<void> => {
  // Parse YAML card config, merging with defaults
  const defaults = opts?.cardConfig === null ? {} : parseYaml(DEFAULT_CARD_CONFIG) as ClockWeatherCardConfig
  const overrides = opts?.cardConfig ? parseYaml(opts.cardConfig) as Partial<ClockWeatherCardConfig> : {}
  const cardConfig = { ...defaults, ...overrides }
  const date = opts?.date ?? DEFAULT_DATE

  // Set dashboard card config via HA websocket
  await api.setDashboardConfig(TEST_DASHBOARD, cardConfig)

  // Set weather state via mock_weather service. Always pass supported_features so
  // tests that mutate it can't leak state to the next test.
  await api.setMockWeather({
    condition: opts?.weather?.state ?? 'sunny',
    temperature: opts?.weather?.temperature ?? 21,
    humidity: opts?.weather?.humidity ?? 50,
    forecast_daily: opts?.weather?.forecast_daily ?? DEFAULT_FORECAST_DAILY,
    forecast_hourly: opts?.weather?.forecast_hourly ?? defaultForecastHourly(date),
    supported_features: opts?.weather?.supportedFeatures ?? SUPPORTS_DAILY_AND_HOURLY,
  })

  // Set sun entity state via REST API
  const sunState = opts?.sun?.state ?? 'above_horizon'
  await api.setEntityState('sun.sun', sunState, {
    elevation: sunState === 'below_horizon' ? -10 : 30,
    ...(opts?.sun?.attributes ?? {}),
  })

  // Mock the browser clock
  await page.clock.setFixedTime(date)

  // Reset HA-global state to defaults so tests don't leak language/tz across runs.
  await api.setLanguage(opts?.language ?? 'en')
  await api.setTimeZone(opts?.timeZone ?? 'Europe/Berlin')

  // Skip goto on follow-up calls so HA's live WS push hits the mounted card without a reload.
  if (!page.url()
    .includes(`/${TEST_DASHBOARD}/`)) {
    await page.goto(`/${TEST_DASHBOARD}/0`)
  }

  // Wait until the dashboard has rendered something for our card slot — either
  // the card itself, or HA's hui-error-card wrapper if setConfig threw.
  await page.locator('clock-weather-card')
    .or(page.locator('hui-error-card'))
    .first()
    .waitFor({ state: 'visible' })

  // Wait until every icon has committed its final src, then strip SMIL so screenshots
  // are deterministic (Playwright's `animations: 'disabled'` only covers CSS animations).
  await waitForIconsSettled(page, opts?.expectedIcons ?? 1)
  await freezeSvgAnimations(page)
}

async function waitForIconsSettled (page: Page, minIcons: number): Promise<void> {
  // A config error renders an error card and no icons at all — pass in that case.
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

async function freezeSvgAnimations (page: Page): Promise<void> {
  await page.evaluate(async (smilTags: string[]) => {
    const pending: Promise<unknown>[] = []
    const smilPattern = new RegExp(`<(${smilTags.join('|')})\\b`)

    function processElement (root: Document | ShadowRoot): void {
      for (const img of root.querySelectorAll('img')) {
        const src = img.getAttribute('src') ?? ''
        if (!src.startsWith('data:image/svg+xml')) continue

        const commaIdx = src.indexOf(',')
        if (commaIdx === -1) continue

        const svgText = decodeURIComponent(src.slice(commaIdx + 1))
        if (!smilPattern.test(svgText)) continue

        const doc = new DOMParser()
          .parseFromString(svgText, 'image/svg+xml')
        const smilElements = doc.querySelectorAll(smilTags.join(','))
        if (smilElements.length === 0) continue

        smilElements.forEach(el => el.remove())
        const frozen = new XMLSerializer()
          .serializeToString(doc)
        img.src = 'data:image/svg+xml,' + encodeURIComponent(frozen)
        // Wait for the browser to decode the replaced src so the screenshot
        // captures the frozen frame, not the still-animating previous one.
        pending.push(img.decode()
          .catch(() => undefined))
      }

      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) processElement(el.shadowRoot)
      }
    }

    processElement(document)
    await Promise.all(pending)
  }, ['animate', 'animateTransform', 'animateMotion', 'set'])
}
