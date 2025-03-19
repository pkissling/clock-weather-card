import {test, expect} from '@playwright/test'

// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url', async ({page}) => {
  await page.goto('/')
  await page.waitForFunction(
    () => customElements.get('clock-weather-card-dev') !== undefined,
  )

  // Now inject your values
  await page.evaluate(() => {
    const element = document.getElementById('clock-weather-card-dev')
    element.setConfig({foo: 'bar'})
    element.hass = {bar: 'foo'}
  })

  await expect(page.locator('h1')).toHaveText('Hello, world!')
  await expect(page.locator('pre').nth(0)).toHaveText('{"foo":"bar"}')
  await expect(page.locator('pre').nth(1)).toHaveText('{"bar":"foo"}')
})
