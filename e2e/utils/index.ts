import { expect, Page } from '@playwright/test'
import { HassEntity } from 'home-assistant-js-websocket'
import { ClockWeatherCardConfig, WeatherForecastEvent } from '../../src/types'
import { HomeAssistant } from 'custom-card-helpers'
import { ClockWeatherCard } from '../../src/clock-weather-card'

export const expectScreenshot = async (page: Page, screenshotName: string): Promise<void> => {
  const clockWeatherCard = page.locator('clock-weather-card-dev')

  await expect(async () => {
    await expect(clockWeatherCard).toHaveScreenshot(`${screenshotName}.png`, { maxDiffPixelRatio: 0.02 })
  }).toPass({ intervals: [1] })
}

export const mockClockWeatherCardState = async (page: Page, opts?: { weatherState?: Partial<HassEntity> }, config?: Partial<ClockWeatherCardConfig>): Promise<void> => {
  const clockWeatherCard = page.locator('clock-weather-card-dev')

  const combinedConfig = {
    type: 'clock-weather-card-dev',
    entity: config?.entity ?? 'weather.home',
    ...config
  } as ClockWeatherCardConfig

  const states = {
    [combinedConfig.entity]: {
      entity_id: combinedConfig.entity,
      state: opts?.weatherState?.state ?? 'sunny',
      attributes: opts?.weatherState?.attributes ?? {},
      last_changed: '2024-01-01T12:00:00+00:00',
      last_updated: '2024-01-01T12:00:00+00:00',
      context: {
        id: '00000000000000000000000000',
        user_id: null,
        parent_id: null
      }
    }
  }

  const forecastEvent = {
    type: 'daily' as const,
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

  const combinedHass = {
    states,
    config: {
      unit_system: {
        temperature: '°C'
      }
    }
  } as HomeAssistant

  await clockWeatherCard.evaluate((el: ClockWeatherCard, { config, hass, forecastEvent }) => {
    el.setConfig(config)
    const connection = {
      subscribeMessage: (callback: (ev: WeatherForecastEvent) => void) => {
        callback(forecastEvent)
        return Promise.resolve(async () => { })
      }
    } as unknown as HomeAssistant['connection']
    el.hass = ({ ...hass, connection })
  }, { config: combinedConfig, hass: combinedHass, forecastEvent })
}
