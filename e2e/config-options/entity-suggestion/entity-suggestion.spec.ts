import type { Page } from '@playwright/test'

import { expect, test } from '../../utils/fixtures'

const suggest = (page: Page, entityId: string): Promise<unknown> => page.evaluate(id => window.customCards
  .find(c => c.type === 'clock-weather-card')!
  .getEntitySuggestion!(undefined as never, id), entityId)

test.describe('entity suggestion', () => {
  test('suggests the card for weather entities', async ({ page, setupCard }) => {
    await setupCard()

    expect(await suggest(page, 'weather.home'))
      .toEqual({ config: { type: 'custom:clock-weather-card', entity: 'weather.home' } })
  })

  test('does not suggest the card for other entities', async ({ page, setupCard }) => {
    await setupCard()

    expect(await suggest(page, 'sensor.weather_temperature'))
      .toBeNull()
  })
})
