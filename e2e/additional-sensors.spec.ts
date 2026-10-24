import { test } from './utils/fixtures'

test.describe('additional_sensors', () => {
  test('rejects a value that is not a map', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'additional_sensors: sensor.outdoor_temperature' })

    await cardErrorMessage()
      .toContain('Config option "additional_sensors" has invalid value "sensor.outdoor_temperature", expected a map of sensor types to entity IDs')
  })
})
