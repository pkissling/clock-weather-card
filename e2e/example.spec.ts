import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import type { HomeAssistant } from 'custom-card-helpers'
import type { HassEntities, HassEntity } from 'home-assistant-js-websocket'

import type { ClockWeatherCard } from '../src/clock-weather-card'
import type { ClockWeatherCardConfig, WeatherForecastEvent } from '../src/types'
import { expectScreenshot } from './utils'


test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('mock weather entity', async ({ page }) => {
  const entities = [{
    entity_id: 'weather.home',
    state: 'sunny'
  }]
  const config = { entity: 'weather.home' }
  await mockState(page, entities, config)

  await expectScreenshot(page, 'card-sunny.png')
})

const mockState = async (page: Page, entities: Partial<HassEntity>[], config: Partial<ClockWeatherCardConfig>): Promise<void> => {
  const clockWeatherCard = page.locator('clock-weather-card-dev')

  const combinedConfig = {
    type: 'clock-weather-card-dev',
    ...config
  } as ClockWeatherCardConfig

  const states = entities.reduce((accStates, e) => {
    const entityId = e.entity_id ?? 'unknown.entity'
    accStates[entityId] = {
      entity_id: entityId,
      state: e.state ?? 'unknown',
      last_changed: '2024-01-01T12:00:00+00:00',
      last_updated: '2024-01-01T12:00:00+00:00',
      attributes: e.attributes ?? {},
      context: e.context ?? {
        id: '00000000000000000000000000',
        user_id: null,
        parent_id: null
      }
    }
    return accStates
  }, {} as HassEntities)

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
