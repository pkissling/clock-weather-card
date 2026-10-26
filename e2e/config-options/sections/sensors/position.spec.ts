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

const precedingSibling = (position: string): string => `${SENSORS}            position: ${position}\n`

test.describe('sections.sensors.position', () => {
  test('renders below the header by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ entities: ENTITIES, cardConfig: SENSORS })

    await expect(clockWeatherCard.locator('clock-weather-card-header + clock-weather-card-sensors'))
      .toHaveCount(1)
  })

  test('moves the section at runtime (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ entities: ENTITIES, cardConfig: precedingSibling('below_strip') })
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip + clock-weather-card-sensors'))
      .toHaveCount(1)

    await setupCard({ entities: ENTITIES, cardConfig: precedingSibling('bottom') })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list + clock-weather-card-sensors'))
      .toHaveCount(1)
  })

  test('rejects an unknown position', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ entities: ENTITIES, cardConfig: precedingSibling('top') })

    await cardErrorMessage()
      .toContain('Config option "sections.sensors.position" has invalid value "top"')
  })
})
