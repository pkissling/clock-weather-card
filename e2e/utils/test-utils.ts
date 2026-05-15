import type { Page } from '@playwright/test'
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
}

const DEFAULT_CARD_CONFIG = `
entity: ${WEATHER_ENTITY}
`

const DEFAULT_FORECAST_DAILY: WeatherForecast[] = [
  { datetime: '2024-01-02T00:00:00+00:00', condition: 'sunny', temperature: 21, precipitation_probability: 0 },
  { datetime: '2024-01-03T00:00:00+00:00', condition: 'cloudy', temperature: 19, precipitation_probability: 30 },
]

const DEFAULT_DATE = new Date('2025-09-14T14:20:59+00:00')

// 24 hourly entries starting at the hour boundary just before `now`, so the first entry feeds the
// strip's "Now" column. All entries carry precipitation probability > 0 except the 2nd and 3rd,
// which exercise the "non-zero alongside zero" rendering path.
const defaultForecastHourly = (now: Date): WeatherForecast[] => {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0)
  const conditions = ['sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'rainy', 'rainy', 'clear-night', 'clear-night', 'clear-night', 'clear-night', 'clear-night', 'clear-night', 'clear-night', 'sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'rainy', 'cloudy', 'partlycloudy']
  return Array.from({ length: 24 }, (_, i) => ({
    datetime: new Date(start + i * 60 * 60 * 1000)
      .toISOString(),
    condition: conditions[i],
    temperature: 22 - Math.abs(i - 4) % 14,
    precipitation_probability: i === 1 || i === 2 ? 0 : (i >= 6 && i <= 8 ? 60 : 20),
  }))
}

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

  // For animated icons: the icon loads asynchronously (static first, then animated
  // replaces it). Wait until the animated variant is in the <img> src, then strip
  // SMIL so screenshots are deterministic. Playwright's `animations: 'disabled'`
  // only handles CSS animations, not SMIL.
  if (cardConfig.animated_icon !== false) {
    await waitForAnimatedIcon(page)
    await freezeSvgAnimations(page)
  }
}

const SMIL_PATTERN = /<(animate|animateTransform|animateMotion|set)\b/

async function waitForAnimatedIcon (page: Page): Promise<void> {
  // Best effort: some animated meteocons variants (e.g. plain sun) contain no SMIL,
  // in which case there's nothing to wait for. Swallow the timeout.
  await page.waitForFunction((smilPatternSrc: string) => {
    const smilPattern = new RegExp(smilPatternSrc)

    function hasAnimatedSvg (root: Document | ShadowRoot): boolean {
      for (const img of root.querySelectorAll('img')) {
        const src = img.getAttribute('src') ?? ''
        if (!src.startsWith('data:image/svg+xml')) continue
        if (smilPattern.test(decodeURIComponent(src))) return true
      }
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot && hasAnimatedSvg(el.shadowRoot)) return true
      }
      return false
    }

    return hasAnimatedSvg(document)
  }, SMIL_PATTERN.source, { timeout: 2000 })
    .catch(() => undefined)
}

async function freezeSvgAnimations (page: Page): Promise<void> {
  await page.evaluate(async (smilTags: string[]) => {
    const pending: Promise<unknown>[] = []

    function processElement (root: Document | ShadowRoot): void {
      for (const img of root.querySelectorAll('img')) {
        const src = img.getAttribute('src') ?? ''
        if (!src.startsWith('data:image/svg+xml')) continue

        const commaIdx = src.indexOf(',')
        if (commaIdx === -1) continue

        const svgText = decodeURIComponent(src.slice(commaIdx + 1))
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
