import { expect, test } from '../../../utils/fixtures'

const ENTITIES = {
  'sensor.station_uv': { state: '3', attributes: { friendly_name: 'Station UV', icon: 'mdi:weather-sunny-alert', state_class: 'measurement' } },
  'sensor.station_wind': { state: '12', attributes: { friendly_name: 'Station wind', unit_of_measurement: 'km/h', device_class: 'wind_speed' } },
}

const SENSORS = `
        sections:
          sensors:
            entities:
              - entity: sensor.station_uv
              - entity: sensor.station_wind
`

test.describe('sections.sensors.show_name', () => {
  test('hides names by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ entities: ENTITIES, cardConfig: SENSORS })

    await expect(clockWeatherCard.locator('clock-weather-card-sensors .sensor-name'))
      .toHaveCount(0)
  })

  test('shows friendly names at runtime when enabled (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ entities: ENTITIES, cardConfig: SENSORS })
    await setupCard({ entities: ENTITIES, cardConfig: `${SENSORS}            show_name: true\n` })

    await expect(clockWeatherCard.locator('clock-weather-card-sensors .sensor-name'))
      .toHaveText(['Station UV', 'Station wind'])
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ entities: ENTITIES, cardConfig: `${SENSORS}            show_name: yes please\n` })

    await cardErrorMessage()
      .toContain('Config option "sections.sensors.show_name" has invalid value "yes please", expected true or false')
  })
})
