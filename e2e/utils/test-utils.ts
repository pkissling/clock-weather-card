import type { Page } from '@playwright/test'
import { parse as parseYaml } from 'yaml'

import type { WeatherForecast } from '../../src/types'
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
animated_icon: false
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
  const defaults = parseYaml(DEFAULT_CARD_CONFIG) as Record<string, unknown>
  const overrides = opts?.cardConfig ? parseYaml(opts.cardConfig) as Record<string, unknown> : {}
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
  await page.locator('clock-weather-card').waitFor({ state: 'visible' })
}
