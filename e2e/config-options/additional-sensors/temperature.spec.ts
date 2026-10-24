import type { DailyWeatherForecast, WeatherForecast } from '../../../src/types'
import { expect, test } from '../../utils/fixtures'
import haApi from '../../utils/ha-api'

const SENSOR = 'sensor.e2e_outdoor_temperature'
const NOW = new Date('2025-09-14T18:00:00+00:00')
const HOURLY: WeatherForecast[] = [
  { datetime: '2025-09-14T18:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
  { datetime: '2025-09-14T19:00:00+00:00', condition: 'sunny', temperature: 19, precipitation_probability: 0 },
]
const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny', templow: 15, temperature: 20, precipitation_probability: 0 },
]

const cardConfig = (sections = '', round = true): string => `
  round_temperatures: ${round}
  additional_sensors:
    temperature: ${SENSOR}
  sections:
    header:
      rows:
        - segments:
            - type: weather
              attribute: temperature
    ${sections}
`

test.describe('additional_sensors.temperature', () => {
  test('replaces the current temperature everywhere, converted', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      entities: { [SENSOR]: { state: '74.31', attributes: { unit_of_measurement: '°F' } } },
      date: NOW,
      cardConfig: cardConfig(`
    forecast_list:
      forecast_type: hourly
      `),
      weather: { temperature: 10, forecast_hourly: HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('24°C')
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

  test('limits the sensor to one decimal when round_temperatures is false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      entities: { [SENSOR]: { state: '23.46', attributes: { unit_of_measurement: '°C' } } },
      date: NOW,
      cardConfig: cardConfig(`
    forecast_list:
      forecast_type: hourly
      `, false),
      weather: { forecast_hourly: HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('23.5°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .label')
      .first())
      .toHaveText('23.5°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-high')
      .first())
      .toHaveText('23.5°C')
  })

  test('stretches today\'s daily bar to the sensor temperature', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      entities: { [SENSOR]: { state: '25', attributes: { unit_of_measurement: '°C' } } },
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
    await setupCard({
      entities: { [SENSOR]: { state: 'unavailable', attributes: { unit_of_measurement: '°C' } } },
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
    await setupCard({ cardConfig: cardConfig(), entities: { [SENSOR]: { state: 'unavailable', attributes: { unit_of_measurement: '°C' } } } })
    const segment = clockWeatherCard.locator('clock-weather-card-weather-segment')
    await expect(segment)
      .toHaveText('')

    await haApi.setEntityState(SENSOR, '18.2', { unit_of_measurement: '°C' })

    await expect(segment)
      .toHaveText('18°C')
  })

  test('follows the sensor\'s display precision over round_temperatures', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: cardConfig()
        .replace(SENSOR, 'sensor.mock_sensor'),
      entities: { 'sensor.mock_sensor': { state: 23.46, attributes: { unit_of_measurement: '°C' }, displayPrecision: 0 } },
    })
    const segment = clockWeatherCard.locator('clock-weather-card-weather-segment')
    await expect(segment)
      .toHaveText('23°C')

    await haApi.setDisplayPrecision('sensor.mock_sensor', 2)

    await expect(segment)
      .toHaveText('23.46°C')
    await haApi.setMockSensor('sensor.mock_sensor', 23.5, '°C')
    await expect(segment)
      .toHaveText('23.50°C')
  })

  test('swaps to the error card without page errors when the sensor disappears (no reload)', async ({ page, setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: cardConfig(), entities: { [SENSOR]: { state: '18.2', attributes: { unit_of_measurement: '°C' } } } })
    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('18°C')
    const errors: Error[] = []
    const onError = (e: Error): void => { errors.push(e) }
    page.on('pageerror', onError)

    await haApi.removeEntityState(SENSOR)

    await cardErrorMessage()
      .toContain(`Referenced entity "${SENSOR}" does not exist`)
    page.off('pageerror', onError)
    expect(errors)
      .toEqual([])
  })

  test('recovers from the error card when the missing sensor appears (no reload)', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: cardConfig() })
    await cardErrorMessage()
      .toContain(`Referenced entity "${SENSOR}" does not exist`)

    await haApi.setEntityState(SENSOR, '18.2', { unit_of_measurement: '°C' })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
      .toHaveText('18°C')
  })

  test('rejects a sensor that does not exist', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'additional_sensors: { temperature: sensor.does_not_exist }' })

    await cardErrorMessage()
      .toContain('Referenced entity "sensor.does_not_exist" does not exist')
  })

  test('rejects a sensor without a temperature unit', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: `additional_sensors: { temperature: ${SENSOR} }`, entities: { [SENSOR]: { state: '42', attributes: { unit_of_measurement: '%' } } } })

    await cardErrorMessage()
      .toContain(`Config option "additional_sensors.temperature" has invalid value "${SENSOR}", expected a sensor with unit °C or °F, got "%"`)
  })

  test('rejects a sensor with a non-numeric state', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: `additional_sensors: { temperature: ${SENSOR} }`, entities: { [SENSOR]: { state: 'warm', attributes: { unit_of_measurement: '°C' } } } })

    await cardErrorMessage()
      .toContain(`Config option "additional_sensors.temperature" has invalid value "${SENSOR}", expected a sensor with a numeric state, got "warm"`)
  })
})
