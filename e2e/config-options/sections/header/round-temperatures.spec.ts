import { expect, test } from '../../../utils/fixtures'

const rows = (round: string): string => `
  sections:
    header:
      ${round}
      rows:
        - segments:
            - type: weather
              attribute: temperature
            - type: weather
              attribute: dew_point
            - type: weather
              attribute: soil
              unit_attribute: soil_scale
`

const WEATHER = { temperature: 21.6, dew_point: 19.4, extra_attributes: { soil: 50.5, soil_scale: '°F' } }

test.describe('sections.header.round_temperatures', () => {
  test('rounds every temperature of weather segments by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: rows(''),
      weather: WEATHER,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText(['22°C', '19°C', '10°C'])
  })

  test('shows fractional temperatures when false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: rows('round_temperatures: false'),
      weather: WEATHER,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText(['21.6°C', '19.4°C', '10.3°C'])
  })

  test('toggles rounding at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: rows('round_temperatures: false'), weather: WEATHER })
    const temperature = clockWeatherCard.locator('clock-weather-card-weather-segment')
      .first()
    await expect(temperature)
      .toHaveText('21.6°C')

    await setupCard({ cardConfig: rows('round_temperatures: true'), weather: WEATHER })

    await expect(temperature)
      .toHaveText('22°C')
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections: { header: { round_temperatures: fals } }' })

    await cardErrorMessage()
      .toContain('Config option "sections.header.round_temperatures" has invalid value "fals", expected true or false')
  })
})
