import { expect, test } from '../../../../../utils/fixtures'

const AQI_BANDS = '{ 0: \'#00E400\', 51: \'#FFFF00\', 101: \'#FF7E00\', 301: \'#7E0023\' }'
const aqiSensor = (state: string): Record<string, { state: string, attributes: Record<string, string> }> =>
  ({ 'sensor.aqi': { state, attributes: { unit_of_measurement: 'AQI' } } })
const badgeConfig = (options = ''): string =>
  `sections: { header: { rows: [{ segments: [{ type: badge, entity_id: sensor.aqi, background_color: ${AQI_BANDS}${options} }] }] } }`

test.describe('sections.header.rows[].segments[] of type badge', () => {
  test('shows the value on the color of its band with readable text and follows changes', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: badgeConfig(), entities: aqiSensor('120') })

    const badge = clockWeatherCard.locator('clock-weather-card-badge-segment .badge')
    await expect(badge)
      .toHaveText('120 AQI')
    await expect(badge)
      .toHaveCSS('background-color', 'rgb(255, 126, 0)')
    await expect(badge)
      .toHaveCSS('color', 'rgb(0, 0, 0)')

    await setupCard({ cardConfig: badgeConfig(), entities: aqiSensor('320') })
    await expect(badge)
      .toHaveCSS('background-color', 'rgb(126, 0, 35)')
    await expect(badge)
      .toHaveCSS('color', 'rgb(255, 255, 255)')
  })

  test('picks the band by an attribute', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'sections: { header: { rows: [{ segments: [{ type: badge, entity_id: weather.mock_weather, attribute: aqi, background_color: { 0: \'#00E400\', 51: \'#FFFF00\' } }] }] } }',
      weather: { extra_attributes: { aqi: 60 } },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-badge-segment .badge'))
      .toHaveCSS('background-color', 'rgb(255, 255, 0)')
  })

  test('uses the configured text color', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: badgeConfig(', text_color: \'#ff00ff\''), entities: aqiSensor('10') })

    await expect(clockWeatherCard.locator('clock-weather-card-badge-segment .badge'))
      .toHaveCSS('color', 'rgb(255, 0, 255)')
  })

  test('shows the value without a background below the lowest band or for a non-numeric state', async ({ setupCard, clockWeatherCard }) => {
    const cardConfig = 'sections: { header: { rows: [{ segments: [{ type: badge, entity_id: sensor.aqi, background_color: { 10: \'#00E400\' } }] }] } }'
    await setupCard({ cardConfig, entities: aqiSensor('5') })

    const segment = clockWeatherCard.locator('clock-weather-card-badge-segment')
    await expect(segment)
      .toHaveText('5 AQI')
    await expect(segment.locator('.badge'))
      .toHaveCount(0)

    await setupCard({ cardConfig, entities: aqiSensor('unknown') })
    await expect(segment)
      .toHaveText('unknown AQI')
    await expect(segment.locator('.badge'))
      .toHaveCount(0)
  })

  test('rejects a badge without background_color', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections: { header: { rows: [{ segments: [{ type: badge, entity_id: sensor.aqi }] }] } }', entities: aqiSensor('5') })

    await cardErrorMessage()
      .toContain('Config option "sections.header.rows[0].segments[0].background_color" is required')
  })

  test('rejects a background_color that is not a map', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections: { header: { rows: [{ segments: [{ type: badge, entity_id: sensor.aqi, background_color: \'#00E400\' }] }] } }', entities: aqiSensor('5') })

    await cardErrorMessage()
      .toContain('Config option "sections.header.rows[0].segments[0].background_color" has invalid value "#00E400", expected a map of values to colors')
  })

  test('rejects a threshold with an unsupported color', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections: { header: { rows: [{ segments: [{ type: badge, entity_id: sensor.aqi, background_color: { 0: green } }] }] } }', entities: aqiSensor('5') })

    await cardErrorMessage()
      .toContain('Config option "sections.header.rows[0].segments[0].background_color" has invalid value "value at 0", expected hex (#rgb, #rrggbb) or rgb() colors')
  })

  test('rejects a non-numeric threshold', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections: { header: { rows: [{ segments: [{ type: badge, entity_id: sensor.aqi, background_color: { low: \'#00E400\' } }] }] } }', entities: aqiSensor('5') })

    await cardErrorMessage()
      .toContain('Config option "sections.header.rows[0].segments[0].background_color" has invalid value "key low", expected numeric keys')
  })

  test('rejects an empty text color', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: badgeConfig(', text_color: \'\''), entities: aqiSensor('5') })

    await cardErrorMessage()
      .toContain('Config option "sections.header.rows[0].segments[0].text_color" has invalid value "", expected a non-empty string')
  })

  test('rejects an unknown entity like the entity segment', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: badgeConfig() })

    await cardErrorMessage()
      .toContain('Referenced entity "sensor.aqi" does not exist')
  })
})
