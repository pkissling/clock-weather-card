import { expect, type Locator, type Page } from '@playwright/test'

import api from './ha-api'
import { TEST_DASHBOARD } from './ha-setup'

export const openEditor = async (page: Page): Promise<Locator> => {
  await page.goto(`/${TEST_DASHBOARD}/0?edit=1`)
  await page.locator('hui-card-options')
    .getByText('Edit', { exact: true })
    .click()
  const editor = page.locator('clock-weather-card-editor')
  await editor.waitFor()
  return editor
}

// Saves the dialog and returns the card config as Home Assistant stored it.
export const saveEditor = async (page: Page): Promise<Record<string, unknown>> => {
  await page.getByRole('button', { name: 'Save' })
    .click()
  await expect(page.locator('clock-weather-card-editor'))
    .toHaveCount(0)
  const config = await api.getCardConfig(TEST_DASHBOARD)
  delete config.type
  return config
}
