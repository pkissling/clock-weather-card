import { expect, Page } from '@playwright/test'

export const expectScreenshot = async (page: Page, screenshotName: string): Promise<void> => {
  const clockWeatherCard = page.locator('clock-weather-card-dev')

  await expect(async () => {
    await expect(clockWeatherCard).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: 0.02 })
  }).toPass({ intervals: [1] })
}
