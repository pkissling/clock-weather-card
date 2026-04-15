import type { Page } from '@playwright/test'
import { parse as parseYaml } from 'yaml'

import type { ClockWeatherCardConfig, WeatherForecast } from '../../src/types'
import { HAApi } from './ha-api'
import { TEST_DASHBOARD } from './ha-setup'

const WEATHER_ENTITY = 'weather.mock_weather'

type MockOptions = undefined | {
  weather?: {
    state?: string
    temperature?: number
    humidity?: number
    forecast_daily?: WeatherForecast[]
    forecast_hourly?: WeatherForecast[]
  }
  sunState?: 'above_horizon' | 'below_horizon'
  cardConfig?: string
  date?: Date
}

const DEFAULT_CARD_CONFIG = `
entity: ${WEATHER_ENTITY}
weather_icon_type: line
`

const DEFAULT_FORECAST_DAILY: WeatherForecast[] = [
  {
    datetime: '2024-01-02T00:00:00+00:00',
    condition: 'sunny',
    temperature: 21,
    templow: 11,
    precipitation: 0,
    precipitation_probability: 0,
    humidity: null,
  },
  {
    datetime: '2024-01-03T00:00:00+00:00',
    condition: 'cloudy',
    temperature: 19,
    templow: 9,
    precipitation: 1,
    precipitation_probability: 30,
    humidity: null,
  },
]

export const setupCardTest = async (page: Page, opts: MockOptions): Promise<void> => {
  const api = new HAApi()

  // Parse YAML card config, merging with defaults
  const defaults = parseYaml(DEFAULT_CARD_CONFIG) as ClockWeatherCardConfig
  const overrides = opts?.cardConfig ? parseYaml(opts.cardConfig) as Partial<ClockWeatherCardConfig> : {}
  const cardConfig = { ...defaults, ...overrides }

  // Set dashboard card config via HA websocket
  await api.setDashboardConfig(TEST_DASHBOARD, cardConfig)

  // Set weather state via mock_weather service
  await api.callService('mock_weather', 'set_weather', {
    condition: opts?.weather?.state ?? 'sunny',
    temperature: opts?.weather?.temperature ?? 21,
    humidity: opts?.weather?.humidity ?? 50,
    forecast_daily: opts?.weather?.forecast_daily ?? DEFAULT_FORECAST_DAILY,
    forecast_hourly: opts?.weather?.forecast_hourly ?? [],
  })

  // Set sun entity state via REST API
  await api.setEntityState('sun.sun', opts?.sunState ?? 'above_horizon', {
    elevation: opts?.sunState === 'below_horizon' ? -10 : 30,
  })

  // Mock the browser clock
  await page.clock.setFixedTime(opts?.date ?? new Date('2025-09-14T14:20:59+00:00'))

  // Navigate to the test dashboard
  await page.goto(`/${TEST_DASHBOARD}/0`)

  // Wait for the card to render
  await page.locator('clock-weather-card')
    .waitFor({ state: 'visible' })

  // Freeze SMIL animations in SVG data URIs so screenshots are deterministic.
  // Playwright's `animations: 'disabled'` only handles CSS animations, not SMIL.
  // Only needed for animated icons — static SVGs have no SMIL elements.
  if (cardConfig.animated_icon !== false) {
    await freezeSvgAnimations(page)
  }
}

/**
 * Strip SMIL animation elements from all SVG `<img>` data URIs in the page,
 * including those inside shadow DOMs. This freezes animated SVGs so that
 * consecutive screenshots are stable for visual comparison.
 */
async function freezeSvgAnimations (page: Page): Promise<void> {
  await page.evaluate(() => {
    const SMIL_TAGS = ['animate', 'animateTransform', 'animateMotion', 'set']

    function processElement (root: Document | ShadowRoot): void {
      for (const img of root.querySelectorAll('img')) {
        const src = img.getAttribute('src') ?? ''
        if (!src.startsWith('data:image/svg+xml')) continue

        const commaIdx = src.indexOf(',')
        if (commaIdx === -1) continue

        const svgText = decodeURIComponent(src.slice(commaIdx + 1))
        const doc = new DOMParser()
          .parseFromString(svgText, 'image/svg+xml')
        const smilElements = doc.querySelectorAll(SMIL_TAGS.join(','))
        if (smilElements.length === 0) continue

        smilElements.forEach(el => el.remove())
        const frozen = new XMLSerializer()
          .serializeToString(doc)
        img.src = 'data:image/svg+xml,' + encodeURIComponent(frozen)
      }

      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) processElement(el.shadowRoot)
      }
    }

    processElement(document)
  })
}
