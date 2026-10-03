import { expect, test } from './utils/fixtures'

test.describe('error card', () => {
  test('shows a generic title and the wrapped, code-formatted error message in the card editor preview', async ({ page, setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: ${'hour'.repeat(50)}
      `,
    })

    await clockWeatherCard.evaluate((el) => {
      (el as HTMLElement & { preview: boolean }).preview = true
    })

    const errorCard = page.locator('hui-error-card')

    await expect(errorCard.locator('.title'))
      .toHaveText('Configuration error')
    await expect(errorCard.locator('.message'))
      .toBeVisible()
    await expect(errorCard.locator('.message'))
      .toContainText('Config option sections.forecast_strip.forecast_type has invalid value')
    await expect(errorCard.locator('.message code'))
      .toHaveText(['sections.forecast_strip.forecast_type', 'hour'.repeat(50), 'hourly'])

    const overflow = await errorCard.evaluate((el) => {
      const haCard = el.shadowRoot!.querySelector('ha-card')!
      const message = el.shadowRoot!.querySelector('.message')!
      return {
        card: haCard.scrollWidth - haCard.clientWidth,
        message: message.scrollWidth - message.clientWidth,
      }
    })
    expect(overflow)
      .toEqual({ card: 0, message: 0 })
  })
})
