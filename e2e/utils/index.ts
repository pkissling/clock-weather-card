import { expect, Page } from '@playwright/test'

export const expectScreenshot = async (page: Page, name: string): Promise<void> => {
  const clockWeatherCard = page.locator('clock-weather-card-dev')
  await expect(async () => {
    await expect(clockWeatherCard).toHaveScreenshot(name, { maxDiffPixelRatio: 0.003 })
  }).toPass({ timeout: 5_000 })
}
