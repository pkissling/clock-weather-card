import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { HomeAssistant } from 'custom-card-helpers'
import type { HassEntity } from 'home-assistant-js-websocket'

import type { ClockWeatherCard } from '../src/clock-weather-card'
import type { ClockWeatherCardConfig, WeatherForecastEvent } from '../src/types'

type MockOptions = undefined | {
  weather?: Partial<HassEntity>,
  sunState?: 'above_horizon' | 'below_horizon',
  cardConfig?: Partial<ClockWeatherCardConfig>,
  date?: Date
}

export const toHaveScreenshot = async (page: Page): Promise<void> => {
  const clockWeatherCard = page.locator('clock-weather-card-dev')
  await expect(clockWeatherCard).toHaveScreenshot({ maxDiffPixelRatio: 0.001 })
}

export const mockClockWeatherCardState = async (page: Page, opts: MockOptions): Promise<void> => {
  const clockWeatherCard = page.locator('clock-weather-card-dev')
  const weatherEntity = opts?.cardConfig?.entity ?? 'weather.home'
  const config = mergeConfig(opts?.cardConfig)
  const forecastEvent = mergeForecastEvent(config)
  const hass = mergeHass(weatherEntity, opts)

  await mockDate(page, opts?.date ?? new Date('2025-09-14T14:20:59+00:00'))
  await mockHomeAssistant(clockWeatherCard, config, hass, forecastEvent)
}

function mergeConfig(cardConfig?: Partial<ClockWeatherCardConfig>): ClockWeatherCardConfig {
  return {
    type: 'clock-weather-card-dev',
    entity: cardConfig?.entity ?? 'weather.home',
    animated_icon: cardConfig?.animated_icon ?? false,
    ...cardConfig
  }
}

function mergeStates(weatherEntity: string, opts: MockOptions): HomeAssistant['states'] {
  return {
    [weatherEntity]: {
      entity_id: weatherEntity,
      state: opts?.weather?.state ?? 'sunny',
      attributes: opts?.weather?.attributes ?? {},
      last_changed: '2024-01-01T12:00:00+00:00',
      last_updated: '2024-01-01T12:00:00+00:00',
      context: {
        id: '00000000000000000000000000',
        user_id: null,
        parent_id: null
      }
    },
    'sun.sun': {
      entity_id: 'sun.sun',
      state: opts?.sunState ?? 'above_horizon',
      attributes: {},
      last_changed: '2024-01-01T12:00:00+00:00',
      last_updated: '2024-01-01T12:00:00+00:00',
      context: {
        id: '00000000000000000000000001',
        user_id: null,
        parent_id: null
      }
    }
  }
}

const mergeForecastEvent = (cardConfig: ClockWeatherCardConfig): WeatherForecastEvent => {
  return {
    type: cardConfig.hourly_forecast ? 'hourly' : 'daily',
    forecast: [
      {
        datetime: '2024-01-02T00:00:00+00:00',
        condition: 'sunny',
        temperature: 21,
        templow: 11,
        precipitation: 0,
        precipitation_probability: 0,
        humidity: null
      },
      {
        datetime: '2024-01-03T00:00:00+00:00',
        condition: 'cloudy',
        temperature: 19,
        templow: 9,
        precipitation: 1,
        precipitation_probability: 30,
        humidity: null
      }
    ]
  }
}

const mergeHass = (weatherEntity: string, opts: MockOptions): HomeAssistant => {
  const states = mergeStates(weatherEntity, opts)

  return {
    states,
    config: {
      unit_system: {
        temperature: '°C'
      }
    }
  } as unknown as HomeAssistant
}

const mockHomeAssistant = async (clockWeatherCard: Locator, config: ClockWeatherCardConfig, hass: HomeAssistant, forecastEvent: WeatherForecastEvent): Promise<void> => {
  await clockWeatherCard.evaluate((el: ClockWeatherCard, { config, hass, forecastEvent }) => {
    el.setConfig(config)
    const connection = {
      subscribeMessage: (callback: (ev: WeatherForecastEvent) => void) => {
        callback(forecastEvent)
        return Promise.resolve(async () => { })
      }
    } as unknown as HomeAssistant['connection']
    el.hass = ({ ...hass, connection })
    console.log('Mocked hass and config on clock-weather-card', el, { config, hass, forecastEvent })
  }, { config, hass, forecastEvent })
}

const mockDate = async (page: Page, date: Date): Promise<void> => {
  await page.clock.setFixedTime(date)
}
