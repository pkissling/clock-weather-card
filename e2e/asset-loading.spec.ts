import { expect, test } from './utils/fixtures'

test.describe('asset loading', () => {
  test.use({ freshPage: true })

  test('fetches only the icons it renders', async ({ page, setupCard, clockWeatherCard }) => {
    const urls: string[] = []
    page.on('response', response => {
      const url = new URL(response.url())
      if (!url.pathname.startsWith('/local/')) return
      urls.push(url.origin + url.pathname)
    })

    await setupCard({ cardConfig: 'weather_icon_type: fill' })
    const renderedIcons = await clockWeatherCard.locator('clock-weather-card-icon img')
      .evaluateAll(imgs => imgs.map(img => (img as HTMLImageElement).src))

    const iconUrls = new Set(urls.filter(url => url.endsWith('.svg')))
    expect([...iconUrls].sort())
      .toEqual([...new Set(renderedIcons)].sort())
  })
})
