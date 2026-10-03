import { expect, test } from '../../utils/fixtures'

const ICON_TYPES = ['fill', 'flat', 'line', 'monochrome'] as const

test.describe('weather_icon_type', () => {
  test('each icon type renders a distinct SVG for the same weather state', async ({ setupCard, clockWeatherCard }) => {
    const srcs: Record<string, string | null> = {}
    for (const type of ICON_TYPES) {
      await setupCard({
        cardConfig: `weather_icon_type: ${type}`,
        weather: { state: 'sunny' },
      })
      srcs[type] = await clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon img')
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
    const explicitLineSrc = await clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({
      weather: { state: 'sunny' },
    })
    const omittedSrc = await clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon img')
      .getAttribute('src')

    expect(omittedSrc)
      .toBe(explicitLineSrc)
  })

  test('falls back to line when weather_icon_type is empty', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'weather_icon_type: line',
      weather: { state: 'sunny' },
    })
    const explicitLineSrc = await clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({
      cardConfig: 'weather_icon_type: \'\'',
      weather: { state: 'sunny' },
    })
    const emptySrc = await clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon img')
      .getAttribute('src')

    expect(emptySrc)
      .toBe(explicitLineSrc)
  })

  test('applies to all sections when set globally', async ({ setupCard, clockWeatherCard }) => {
    const sectionIcons = {
      header: 'clock-weather-card-header clock-weather-card-icon img',
      forecast_strip: 'clock-weather-card-hourly-forecast-item clock-weather-card-icon img',
      forecast_list: 'clock-weather-card-daily-forecast-item clock-weather-card-icon img',
    }
    const readSrcs = async (): Promise<Record<string, string | null>> => Object.fromEntries(await Promise.all(
      Object.entries(sectionIcons)
        .map(async ([section, selector]) => [section, await clockWeatherCard.locator(selector)
          .first()
          .getAttribute('src')]),
    ))

    await setupCard({})
    const defaultSrcs = await readSrcs()

    await setupCard({
      cardConfig: `
        sections:
          header: { weather_icon_type: fill }
          forecast_strip: { weather_icon_type: fill }
          forecast_list: { weather_icon_type: fill }
      `,
    })
    const perSectionFillSrcs = await readSrcs()

    await setupCard({ cardConfig: 'weather_icon_type: fill' })
    const globalFillSrcs = await readSrcs()

    for (const section of Object.keys(sectionIcons)) {
      expect(globalFillSrcs[section], `${section} produced no src`)
        .toBeTruthy()
      expect(globalFillSrcs[section], `${section} ignored the global weather_icon_type`).not.toBe(defaultSrcs[section])
      expect(globalFillSrcs[section], `${section} differs from its explicit weather_icon_type: fill`)
        .toBe(perSectionFillSrcs[section])
    }
  })

  test('rejects values that are not one of the supported icon types', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: 'weather_icon_type: gradient',
      weather: { state: 'sunny' },
    })

    expect(await cardErrorMessage())
      .toContain('Config option "weather_icon_type" has invalid value "gradient", expected one of "fill", "flat", "line", "monochrome"')
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(0)
  })

  test('updates the icon type at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'weather_icon_type: line',
      weather: { state: 'sunny' },
    })
    const lineSrc = await clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({ cardConfig: 'weather_icon_type: fill' })

    await expect(clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon img'))
      .not.toHaveAttribute('src', lineSrc!)
  })
})
