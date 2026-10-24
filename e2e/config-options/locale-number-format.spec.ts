import { expect, test } from '../utils/fixtures'

const CARD_CONFIG = `
  round_temperatures: false
  sections:
    header:
      rows:
        - segments:
            - type: weather
              attribute: temperature
            - type: weather
              attribute: pressure
`

test.describe('number format', () => {
  for (const [language, numberFormat, temperature, low, pressure] of <[string, string, string, string, string | RegExp][]>[
    ['de', 'language', '21,5°C', '10,5°C', '1.013,2 hPa'],
    ['en-GB', 'language', '21.5°C', '10.5°C', '1,013.2 hPa'],
    ['de', 'comma_decimal', '21.5°C', '10.5°C', '1,013.2 hPa'],
    ['en-GB', 'decimal_comma', '21,5°C', '10,5°C', '1.013,2 hPa'],
    ['en-GB', 'space_comma', '21,5°C', '10,5°C', '1 013,2 hPa'],
    ['en-GB', 'quote_decimal', '21.5°C', '10.5°C', /^1['’]013\.2 hPa$/],
    ['de', 'none', '21.5°C', '10.5°C', '1013.2 hPa'],
  ]) {
    test(`follows the HA "${numberFormat}" number format with language ${language}`, async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        language,
        numberFormat,
        cardConfig: CARD_CONFIG,
        weather: {
          temperature: 21.5,
          extra_attributes: { pressure: 1013.2, pressure_unit: 'hPa' },
          forecast_daily: [{ datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny', templow: 10.5, temperature: 25 }],
        },
      })

      const segments = clockWeatherCard.locator('clock-weather-card-weather-segment')
      await expect(segments.nth(0))
        .toHaveText(temperature)
      await expect(segments.nth(1))
        .toHaveText(pressure)
      await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-low')
        .first())
        .toHaveText(low)
    })
  }

  test('uses the card locale for the "language" number format', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      language: 'en-GB',
      cardConfig: `
        locale: de
        round_temperatures: false
        sections:
          header:
            rows:
              - segments:
                  - type: weather
                    attribute: temperature
      `,
      weather: { temperature: 21.5 },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment')
      .first())
      .toHaveText('21,5°C')
  })

  test('formats the temperature sensor and numeric entity segments', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      language: 'de',
      entities: {
        'sensor.e2e_number_temperature': { state: '21.5', attributes: { unit_of_measurement: '°C' } },
        'sensor.e2e_number_pressure': { state: '1013.2', attributes: { unit_of_measurement: 'hPa' } },
        'sensor.e2e_number_count': { state: '1234.5', attributes: { state_class: 'measurement' } },
        'sensor.e2e_number_code': { state: '12345' },
      },
      cardConfig: `
        additional_sensors:
          temperature: sensor.e2e_number_temperature
        round_temperatures: false
        sections:
          header:
            rows:
              - segments:
                  - type: weather
                    attribute: temperature
                  - type: entity
                    entity_id: sensor.e2e_number_pressure
                  - type: entity
                    entity_id: sensor.e2e_number_count
                  - type: entity
                    entity_id: sensor.e2e_number_code
                    show_unit: false
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('21,5°C')
    await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
      .toHaveText(['1.013,2 hPa', '1.234,5', '12345'])
  })
})
