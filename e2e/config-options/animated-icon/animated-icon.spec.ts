import { expect, test } from '../../utils/fixtures'

test.describe('animated_icon', () => {
  test('animated_icon: false renders a static SVG without SMIL animation tags', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'animated_icon: false',
      weather: { state: 'sunny' },
    })
    const src = await clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
      .getAttribute('src')
    expect(src)
      .toBeTruthy()
    const svg = decodeURIComponent(src!.replace(/^data:image\/svg\+xml;base64,/, ''))
    expect(svg).not.toMatch(/<animate(Transform|Motion)?\b/)
  })

  test('animated_icon: true loads a different SVG asset than animated_icon: false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'animated_icon: false',
      weather: { state: 'rainy' },
    })
    const staticSrc = await clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({
      cardConfig: 'animated_icon: true',
      weather: { state: 'rainy' },
    })
    const animatedSrc = await clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
      .getAttribute('src')

    expect(staticSrc)
      .toBeTruthy()
    expect(animatedSrc)
      .toBeTruthy()
    expect(animatedSrc).not.toBe(staticSrc)
  })

  test('updates animated_icon at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'animated_icon: false',
      weather: { state: 'rainy' },
    })
    const staticSrc = await clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({ cardConfig: 'animated_icon: true' })

    await expect(clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img'))
      .not.toHaveAttribute('src', staticSrc!)
  })
})
