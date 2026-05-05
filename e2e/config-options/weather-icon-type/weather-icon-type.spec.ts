import { expect, test } from '../../utils/fixtures'
import { updateCard } from '../../utils/test-utils'

const ICON_TYPES = ['fill', 'flat', 'line', 'monochrome'] as const

test.describe('weather_icon_type', () => {
  test('each icon type renders a distinct SVG for the same weather state', async ({ setupCard, clockWeatherCard }) => {
    const srcs: Record<string, string | null> = {}
    for (const type of ICON_TYPES) {
      await setupCard({
        cardConfig: `weather_icon_type: ${type}`,
        weather: { state: 'sunny' },
      })
      srcs[type] = await clockWeatherCard.locator('clock-weather-card-icon img')
        .getAttribute('src')
      expect(srcs[type], `weather_icon_type: ${type} produced no src`)
        .toBeTruthy()
    }

    expect(new Set(Object.values(srcs)).size, 'expected all 4 icon types to render distinct SVGs')
      .toBe(ICON_TYPES.length)
  })

  test('falls back to line when weather_icon_type is omitted', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'weather_icon_type: line',
      weather: { state: 'sunny' },
    })
    const explicitLineSrc = await clockWeatherCard.locator('clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({
      weather: { state: 'sunny' },
    })
    const omittedSrc = await clockWeatherCard.locator('clock-weather-card-icon img')
      .getAttribute('src')

    expect(omittedSrc)
      .toBe(explicitLineSrc)
  })

  test('falls back to line when weather_icon_type is empty', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'weather_icon_type: line',
      weather: { state: 'sunny' },
    })
    const explicitLineSrc = await clockWeatherCard.locator('clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({
      cardConfig: 'weather_icon_type: \'\'',
      weather: { state: 'sunny' },
    })
    const emptySrc = await clockWeatherCard.locator('clock-weather-card-icon img')
      .getAttribute('src')

    expect(emptySrc)
      .toBe(explicitLineSrc)
  })

  test('updates the icon type at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'weather_icon_type: line',
      weather: { state: 'sunny' },
    })
    const lineSrc = await clockWeatherCard.locator('clock-weather-card-icon img')
      .getAttribute('src')

    await updateCard('weather_icon_type: fill')

    await expect(clockWeatherCard.locator('clock-weather-card-icon img'))
      .not.toHaveAttribute('src', lineSrc!)
  })
})
