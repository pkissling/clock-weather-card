import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import type { HomeAssistant } from 'custom-card-helpers'
import type { HassEntities, HassEntity } from 'home-assistant-js-websocket'
import { LitElement } from 'lit'

import type { ClockWeatherCard } from '../src/clock-weather-card'
import type { ClockWeatherCardConfig } from '../src/types'


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

  await expect(page.getByText('Current Weather: sunny')).toBeVisible()
})

const mockState = async (page: Page, entities: Partial<HassEntity>[], config: Partial<ClockWeatherCardConfig>): Promise<void> => {
  const card = page.locator('clock-weather-card-dev')
  // Wait only for attachment to the DOM; visibility comes after render
  await card.waitFor({ state: 'attached' })

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
  const combinedHass = {
    states
  } as HomeAssistant

  await card.evaluate((el: ClockWeatherCard, { config: cfg, hass }) => {
    el.setConfig(cfg)
    el.hass = hass
  }, { config: combinedConfig, hass: combinedHass })

  // wait until rendering is done
  await card.evaluate((el: LitElement) => el.updateComplete)
}
