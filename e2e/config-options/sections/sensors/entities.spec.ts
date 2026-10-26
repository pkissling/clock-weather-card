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

test.describe('sections.sensors.entities', () => {
  test('renders each sensor with its value and unit', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ entities: ENTITIES, cardConfig: SENSORS })

    const items = clockWeatherCard.locator('clock-weather-card-sensors .sensor')
    await expect(items)
      .toHaveCount(2)
    await expect(items.nth(0))
      .toContainText('3')
    await expect(items.nth(1))
      .toContainText('12 km/h')
  })

  test('applies name, icon and unit overrides', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      entities: ENTITIES,
      cardConfig: `
        sections:
          sensors:
            show_name: true
            entities:
              - entity: sensor.station_uv
                name: UV
                icon: mdi:sun-wireless
                unit: ' idx'
      `,
    })

    const item = clockWeatherCard.locator('clock-weather-card-sensors .sensor')
    await expect(item.locator('.sensor-name'))
      .toHaveText('UV')
    await expect(item.locator('clock-weather-card-entity-segment'))
      .toHaveText('3 idx')
    await expect(item.locator('ha-state-icon'))
      .toHaveJSProperty('icon', 'mdi:sun-wireless')
  })

  test('updates when a sensor changes state (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ entities: ENTITIES, cardConfig: SENSORS })
    await setupCard({ entities: { ...ENTITIES, 'sensor.station_wind': { ...ENTITIES['sensor.station_wind'], state: '30' } }, cardConfig: SENSORS })

    await expect(clockWeatherCard.locator('clock-weather-card-sensors .sensor')
      .nth(1))
      .toContainText('30 km/h')
  })

  test('rejects an unknown entity', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      entities: ENTITIES,
      cardConfig: `
        sections:
          sensors:
            entities:
              - entity: sensor.does_not_exist
      `,
    })

    await cardErrorMessage()
      .toContain('sensor.does_not_exist')
  })
})
