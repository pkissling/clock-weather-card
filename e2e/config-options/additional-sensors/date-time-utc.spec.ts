import { expect, test } from '../../utils/fixtures'
import haApi from '../../utils/ha-api'

const SENSOR = 'sensor.e2e_date_time_utc'
const cardConfig = `
  additional_sensors:
    date_time_utc: ${SENSOR}
  sections:
    header:
      rows:
        - segments:
            - type: date
              date_pattern: yyyy-MM-dd
            - type: time
              time_pattern: HH:mm:ss
`

// The device clock is fixed at DEFAULT_DATE: 2025-09-14 08:20:59 UTC, 10:20:59 in Berlin.
test.describe('additional_sensors.date_time_utc', () => {
  test('shows the device time until the sensor flips, then the server time', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig, entities: { [SENSOR]: { state: '2025-09-13, 21:58' } } })
    const date = clockWeatherCard.locator('clock-weather-card-date-segment')
    const time = clockWeatherCard.locator('clock-weather-card-time-segment')

    // The state present at load may be up to a minute old, so it is not used.
    await expect(time)
      .toHaveText('10:20:59')

    await haApi.setEntityState(SENSOR, '2025-09-13, 21:59')

    // At the flip the server time is 21:59:00 UTC, 23:59:00 of the previous day in Berlin.
    await expect(time)
      .toHaveText('23:59:00')
    await expect(date)
      .toHaveText('2025-09-13')
  })

  test('recovers from the error card when the missing sensor appears (no reload)', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({ cardConfig })
    await cardErrorMessage()
      .toContain(`Referenced entity "${SENSOR}" does not exist`)

    await haApi.setEntityState(SENSOR, '2025-09-14, 10:44')
    const time = clockWeatherCard.locator('clock-weather-card-time-segment')
    await expect(time)
      .toHaveText('10:20:59')

    await haApi.setEntityState(SENSOR, '2025-09-14, 10:45')
    await expect(time)
      .toHaveText('12:45:00')
  })

  test('rejects a sensor that does not exist', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'additional_sensors: { date_time_utc: sensor.does_not_exist }' })

    await cardErrorMessage()
      .toContain('Referenced entity "sensor.does_not_exist" does not exist')
  })

  test('rejects a sensor whose state is not in the format of sensor.date_time_utc', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: `additional_sensors: { date_time_utc: ${SENSOR} }`, entities: { [SENSOR]: { state: '10:15' } } })

    await cardErrorMessage()
      .toContain(`Config option "additional_sensors.date_time_utc" has invalid value "${SENSOR}", expected a sensor with a "yyyy-MM-dd, HH:mm" state like sensor.date_time_utc, got "10:15"`)
  })
})
