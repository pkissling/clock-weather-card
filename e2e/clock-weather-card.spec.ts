import { test, expect } from '@playwright/test'
import { mockState } from './utils'
import { HomeAssistant } from 'custom-card-helpers'

// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url', async ({ page }) => {
  await page.goto('/')

  const mockHass = { bar: 'foo' } as unknown as HomeAssistant
  const mockConfig = { foo: 'bar' } as unknown as ClockWeatherCardConfig

  await mockState(page, mockHass, mockConfig)

  await expect(page.locator('h1')).toHaveText('Hello, world!')
  await expect(page.locator('pre').nth(0)).toHaveText('{"foo":"bar"}')
  await expect(page.locator('pre').nth(1)).toHaveText('{"bar":"foo"}')
})
