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

test.describe('sections.sensors.hide', () => {
  test('renders nothing without entities', async ({ setupCard, clockWeatherCard }) => {
    await setupCard()

    await expect(clockWeatherCard.locator('clock-weather-card-sensors'))
      .toHaveCount(0)
  })

  test('removes the section at runtime when hide flips to true (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ entities: ENTITIES, cardConfig: SENSORS })
    await expect(clockWeatherCard.locator('clock-weather-card-sensors'))
      .toHaveCount(1)

    await setupCard({ entities: ENTITIES, cardConfig: `${SENSORS}            hide: true\n` })

    await expect(clockWeatherCard.locator('clock-weather-card-sensors'))
      .toHaveCount(0)
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ entities: ENTITIES, cardConfig: `${SENSORS}            hide: fals\n` })

    await cardErrorMessage()
      .toContain('Config option "sections.sensors.hide" has invalid value "fals", expected true or false')
  })
})
