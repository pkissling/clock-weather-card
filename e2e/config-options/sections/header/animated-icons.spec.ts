import { expect, test } from '../../../utils/fixtures'

test.describe('sections.header.animated_icons', () => {
  test('animated_icons: false renders a static SVG without SMIL animation tags', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'sections: { header: { animated_icons: false } }',
      weather: { state: 'sunny' },
    })
    const src = await clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
      .getAttribute('src')
    expect(src)
      .toBeTruthy()
    const svg = decodeURIComponent(src!.replace(/^data:image\/svg\+xml;base64,/, ''))
    expect(svg).not.toMatch(/<animate(Transform|Motion)?\b/)
  })

  test('animated_icons: true loads a different SVG asset than animated_icons: false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'sections: { header: { animated_icons: false } }',
      weather: { state: 'rainy' },
    })
    const staticSrc = await clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({
      cardConfig: 'sections: { header: { animated_icons: true } }',
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

  test('updates animated_icons at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'sections: { header: { animated_icons: false } }',
      weather: { state: 'rainy' },
    })
    const staticSrc = await clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({ cardConfig: 'sections: { header: { animated_icons: true } }' })

    await expect(clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img'))
      .not.toHaveAttribute('src', staticSrc!)
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            animated_icons: fals
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.header.animated_icons" has invalid value "fals", expected true or false')
  })
})
