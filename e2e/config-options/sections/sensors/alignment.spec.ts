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

const withAlignment = (alignment: string): string => `${SENSORS}            alignment: ${alignment}\n`

test.describe('sections.sensors.alignment', () => {
  test('spreads the sensors by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ entities: ENTITIES, cardConfig: SENSORS })

    await expect(clockWeatherCard.locator('clock-weather-card-sensors .sensors'))
      .toHaveCSS('justify-content', 'space-between')
  })

  test('changes the alignment at runtime (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ entities: ENTITIES, cardConfig: withAlignment('center') })
    await expect(clockWeatherCard.locator('clock-weather-card-sensors .sensors'))
      .toHaveCSS('justify-content', 'center')

    await setupCard({ entities: ENTITIES, cardConfig: withAlignment('right') })

    await expect(clockWeatherCard.locator('clock-weather-card-sensors .sensors'))
      .toHaveCSS('justify-content', 'right')
  })

  test('rejects an unknown alignment', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ entities: ENTITIES, cardConfig: withAlignment('justify') })

    await cardErrorMessage()
      .toContain('Config option "sections.sensors.alignment" has invalid value "justify"')
  })
})
