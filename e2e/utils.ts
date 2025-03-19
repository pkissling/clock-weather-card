import { Page } from '@playwright/test'

export const setupTestData = async (page: Page, config: Record<string, string>, hass: HomeAssistant): Promise<void> => {
  // Wait for custom element to be defined
  await page.waitForFunction(() => !!customElements.get('clock-weather-card-dev')) 
  
  // Now inject your values
  console.log('setupTestData', config, hass)
  await page.evaluate(() => {
    console.log('setupTestData', config, hass)
    const element = document.getElementById('clock-weather-card-dev')!
    element.setConfig(config)
    element.hass = hass 
  })
}