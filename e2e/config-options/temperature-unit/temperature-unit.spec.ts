import type { DailyWeatherForecast, WeatherForecast } from '../../../src/types'
import { expect, test } from '../../utils/fixtures'
import api from '../../utils/ha-api'

const NOW = new Date('2025-09-14T18:00:00+00:00')
const HOURLY: WeatherForecast[] = [
  { datetime: '2025-09-14T18:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
  { datetime: '2025-09-14T19:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
]
const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny', templow: 5.4, temperature: 30, precipitation_probability: 0 },
]

const temperatureSegmentRow = `
            rows:
              - segments:
                  - type: weather
                    attribute: temperature
`

test.describe('temperature_unit', () => {
  test('converts every temperature to fahrenheit', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      cardConfig: `
        temperature_unit: fahrenheit
        sections:
          header:${temperatureSegmentRow}
      `,
      weather: { temperature: 21, forecast_hourly: HOURLY, forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('70°F')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .label')
      .first())
      .toHaveText('68°F')
    const listItem = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
    await expect(listItem.locator('.temperature-low'))
      .toHaveText('42°F')
    await expect(listItem.locator('.temperature-high'))
      .toHaveText('86°F')
  })

  test('converts fahrenheit weather data to celsius', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      cardConfig: `
        temperature_unit: celsius
        sections:
          header:${temperatureSegmentRow}
      `,
      weather: {
        temperature: 50,
        temperatureUnit: '°F',
        forecast_hourly: HOURLY.map(h => ({ ...h, temperature: 68 })),
        forecast_daily: [{ ...DAILY[0], templow: 41, temperature: 86 }],
      },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('10°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .label')
      .first())
      .toHaveText('20°C')
    const listItem = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
    await expect(listItem.locator('.temperature-low'))
      .toHaveText('5°C')
    await expect(listItem.locator('.temperature-high'))
      .toHaveText('30°C')
  })

  test('keeps the source precision when round_temperatures is false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      cardConfig: `
        temperature_unit: fahrenheit
        sections:
          forecast_list:
            round_temperatures: false
      `,
      weather: { forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-low'))
      .toHaveText('41.7°F')
  })

  test('falls back to the Home Assistant unit system (metric)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:${temperatureSegmentRow}
      `,
      weather: { temperature: 50, temperatureUnit: '°F' },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('10°C')
  })

  test('falls back to the Home Assistant unit system (us_customary)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      unitSystem: 'us_customary',
      cardConfig: `
        sections:
          header:${temperatureSegmentRow}
      `,
      weather: { temperature: 21 },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('70°F')
  })

  test('omits the unit when show_unit is false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        temperature_unit: fahrenheit
        sections:
          header:
            rows:
              - segments:
                  - type: weather
                    attribute: temperature
                    show_unit: false
      `,
      weather: { temperature: 21 },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('70')
  })

  test('converts the value but shows the unit override of a weather segment', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        temperature_unit: fahrenheit
        sections:
          header:
            rows:
              - segments:
                  - type: weather
                    attribute: temperature
                    unit: ' degrees'
      `,
      weather: { temperature: 21 },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('70 degrees')
  })

  test('converts entity segments with a temperature unit', async ({ setupCard, clockWeatherCard }) => {
    await api.setEntityState('sensor.demo_temperature', '20.5', { unit_of_measurement: '°C' })
    await api.setEntityState('sensor.demo_humidity', '45', { unit_of_measurement: '%' })
    await setupCard({
      cardConfig: `
        temperature_unit: fahrenheit
        sections:
          header:
            rows:
              - segments:
                  - type: entity
                    entity_id: sensor.demo_temperature
                  - type: entity
                    entity_id: sensor.demo_humidity
      `,
    })

    const segments = clockWeatherCard.locator('clock-weather-card-entity-segment')
    await expect(segments.nth(0))
      .toHaveText('68.9°F')
    await expect(segments.nth(1))
      .toHaveText('45%')
  })

  test('updates the unit at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        temperature_unit: celsius
        sections:
          header:${temperatureSegmentRow}
      `,
      weather: { temperature: 21 },
    })
    const segment = clockWeatherCard.locator('clock-weather-card-weather-segment')
    await expect(segment)
      .toHaveText('21°C')

    await setupCard({
      cardConfig: `
        temperature_unit: fahrenheit
        sections:
          header:${temperatureSegmentRow}
      `,
      weather: { temperature: 21 },
    })

    await expect(segment)
      .toHaveText('70°F')
  })

  test('rejects an unknown unit', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        temperature_unit: kelvin
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "temperature_unit" has invalid value "kelvin", expected one of "celsius", "fahrenheit"')
  })
})
