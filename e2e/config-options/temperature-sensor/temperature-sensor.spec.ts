import type { DailyWeatherForecast, WeatherForecast } from '../../../src/types'
import { expect, test } from '../../utils/fixtures'
import api from '../../utils/ha-api'

const SENSOR = 'sensor.e2e_outdoor_temperature'
const NOW = new Date('2025-09-14T18:00:00+00:00')
const HOURLY: WeatherForecast[] = [
  { datetime: '2025-09-14T18:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
  { datetime: '2025-09-14T19:00:00+00:00', condition: 'sunny', temperature: 19, precipitation_probability: 0 },
]
const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny', templow: 15, temperature: 20, precipitation_probability: 0 },
]

const cardConfig = (sections = ''): string => `
  temperature_sensor: ${SENSOR}
  sections:
    header:
      rows:
        - segments:
            - type: weather
              attribute: temperature
    ${sections}
`

test.describe('temperature_sensor', () => {
  test('replaces the current temperature everywhere, converted and limited to one decimal', async ({ setupCard, clockWeatherCard }) => {
    await api.setEntityState(SENSOR, '74.31', { unit_of_measurement: '°F' })
    await setupCard({
      date: NOW,
      cardConfig: cardConfig(`
    forecast_list:
      forecast_type: hourly
      `),
      weather: { temperature: 10, forecast_hourly: HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('23.5°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .label')
      .first())
      .toHaveText('24°C')
    const nowRow = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
      .first()
    await expect(nowRow.locator('.temperature-low'))
      .toHaveText('20°C')
    await expect(nowRow.locator('.temperature-high'))
      .toHaveText('24°C')
  })

  test('keeps the sensor decimal when round_temperatures is false', async ({ setupCard, clockWeatherCard }) => {
    await api.setEntityState(SENSOR, '23.46', { unit_of_measurement: '°C' })
    await setupCard({
      date: NOW,
      cardConfig: cardConfig(`
    forecast_strip:
      round_temperatures: false
    forecast_list:
      forecast_type: hourly
      round_temperatures: false
      `),
      weather: { forecast_hourly: HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .label')
      .first())
      .toHaveText('23.5°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-high')
      .first())
      .toHaveText('23.5°C')
  })

  test('stretches today\'s daily bar to the sensor temperature', async ({ setupCard, clockWeatherCard }) => {
    await api.setEntityState(SENSOR, '25', { unit_of_measurement: '°C' })
    await setupCard({
      date: NOW,
      cardConfig: cardConfig(),
      weather: { temperature: 10, forecast_daily: DAILY },
    })

    const today = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
      .first()
    await expect(today.locator('.temperature-low'))
      .toHaveText('15°C')
    await expect(today.locator('.temperature-high'))
      .toHaveText('25°C')
  })

  test('hides the current temperature while the sensor is unavailable', async ({ setupCard, clockWeatherCard }) => {
    await api.setEntityState(SENSOR, 'unavailable', { unit_of_measurement: '°C' })
    await setupCard({
      date: NOW,
      cardConfig: cardConfig(),
      weather: { temperature: 10, forecast_hourly: HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .label')
      .first())
      .toHaveText('20°C')
  })

  test('follows sensor updates and recovers from unavailable (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await api.setEntityState(SENSOR, 'unavailable', { unit_of_measurement: '°C' })
    await setupCard({ cardConfig: cardConfig() })
    const segment = clockWeatherCard.locator('clock-weather-card-weather-segment')
    await expect(segment)
      .toHaveText('')

    await api.setEntityState(SENSOR, '18.2', { unit_of_measurement: '°C' })

    await expect(segment)
      .toHaveText('18.2°C')
  })

  test('follows the sensor\'s display precision', async ({ setupCard, clockWeatherCard }) => {
    await api.setMockSensor('sensor.mock_sensor', 23.46, '°C')
    await api.setDisplayPrecision('sensor.mock_sensor', 0)
    await setupCard({ cardConfig: cardConfig()
      .replace(SENSOR, 'sensor.mock_sensor') })
    const segment = clockWeatherCard.locator('clock-weather-card-weather-segment')
    await expect(segment)
      .toHaveText('23°C')

    await api.setDisplayPrecision('sensor.mock_sensor', 2)

    await expect(segment)
      .toHaveText('23.46°C')
    await api.setMockSensor('sensor.mock_sensor', 23.5, '°C')
    await expect(segment)
      .toHaveText('23.50°C')
  })

  test('rejects a sensor that does not exist', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'temperature_sensor: sensor.does_not_exist' })

    await cardErrorMessage()
      .toContain('Referenced entity "sensor.does_not_exist" does not exist')
  })

  test('rejects a sensor without a temperature unit', async ({ setupCard, cardErrorMessage }) => {
    await api.setEntityState(SENSOR, '42', { unit_of_measurement: '%' })
    await setupCard({ cardConfig: `temperature_sensor: ${SENSOR}` })

    await cardErrorMessage()
      .toContain(`Config option "temperature_sensor" has invalid value "${SENSOR}", expected a sensor with unit °C or °F, got "%"`)
  })

  test('rejects a sensor with a non-numeric state', async ({ setupCard, cardErrorMessage }) => {
    await api.setEntityState(SENSOR, 'warm', { unit_of_measurement: '°C' })
    await setupCard({ cardConfig: `temperature_sensor: ${SENSOR}` })

    await cardErrorMessage()
      .toContain(`Config option "temperature_sensor" has invalid value "${SENSOR}", expected a sensor with a numeric state, got "warm"`)
  })
})
