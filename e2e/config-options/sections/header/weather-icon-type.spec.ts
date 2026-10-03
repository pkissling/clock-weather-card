import { expect, test } from '../../../utils/fixtures'

const HEADER_ICON = 'clock-weather-card-today clock-weather-card-icon img'

test.describe('sections.header.weather_icon_type', () => {
  test('falls back to the top-level weather_icon_type by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'weather_icon_type: fill',
      weather: { state: 'sunny' },
    })
    const inheritedSrc = await clockWeatherCard.locator(HEADER_ICON)
      .getAttribute('src')

    await setupCard({
      cardConfig: 'sections: { header: { weather_icon_type: fill } }',
      weather: { state: 'sunny' },
    })
    const explicitSrc = await clockWeatherCard.locator(HEADER_ICON)
      .getAttribute('src')

    expect(inheritedSrc)
      .toBeTruthy()
    expect(inheritedSrc)
      .toBe(explicitSrc)
  })

  test('overrides the top-level weather_icon_type when set', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'weather_icon_type: line',
      weather: { state: 'sunny' },
    })
    const inheritedSrc = await clockWeatherCard.locator(HEADER_ICON)
      .getAttribute('src')

    await setupCard({
      cardConfig: `
        weather_icon_type: line
        sections:
          header:
            weather_icon_type: fill
      `,
      weather: { state: 'sunny' },
    })
    const overrideSrc = await clockWeatherCard.locator(HEADER_ICON)
      .getAttribute('src')

    expect(overrideSrc)
      .toBeTruthy()
    expect(overrideSrc).not.toBe(inheritedSrc)
  })

  test('does not affect the forecast sections', async ({ setupCard, clockWeatherCard }) => {
    const stripIcon = 'clock-weather-card-hourly-forecast-item clock-weather-card-icon img'
    await setupCard({ cardConfig: 'weather_icon_type: line' })
    const inheritedStripSrc = await clockWeatherCard.locator(stripIcon)
      .first()
      .getAttribute('src')

    await setupCard({
      cardConfig: `
        weather_icon_type: line
        sections:
          header:
            weather_icon_type: fill
      `,
    })

    await expect(clockWeatherCard.locator(stripIcon)
      .first())
      .toHaveAttribute('src', inheritedStripSrc!)
  })

  test('rejects values that are not one of the supported icon types', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: 'sections: { header: { weather_icon_type: gradient } }',
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.header.weather_icon_type" has invalid value "gradient", expected one of "fill", "flat", "line", "monochrome"')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('updates weather_icon_type at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'sections: { header: { weather_icon_type: line } }',
      weather: { state: 'sunny' },
    })
    const lineSrc = await clockWeatherCard.locator(HEADER_ICON)
      .getAttribute('src')

    await setupCard({
      cardConfig: 'sections: { header: { weather_icon_type: monochrome } }',
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard.locator(HEADER_ICON))
      .not.toHaveAttribute('src', lineSrc!)
  })
})
