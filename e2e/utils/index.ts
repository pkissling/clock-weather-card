import { expect, Page } from '@playwright/test'

export const expectScreenshot = async (page: Page, screenshotName: string): Promise<void> => {
  const clockWeatherCard = page.locator('clock-weather-card-dev')

  await expect(async () => {
    console.log('Taking screenshot for weather entity test', new Date().toISOString())
    await expect(clockWeatherCard).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: 0.01 })
  }).toPass({ intervals: [1] })
}
