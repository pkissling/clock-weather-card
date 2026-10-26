import { expect, test } from '../utils/fixtures'

test.describe('sensors section', () => {
  test('opens the more-info dialog of the tapped sensor instead of the card tap action', async ({ page, setupCard, clockWeatherCard }) => {
    await setupCard({
      entities: { 'sensor.station_rain': { state: '1.2', attributes: { friendly_name: 'Station rain', unit_of_measurement: 'mm' } } },
      cardConfig: `
        sections:
          sensors:
            entities:
              - entity: sensor.station_rain
      `,
    })

    await clockWeatherCard.locator('clock-weather-card-sensors .sensor')
      .click()

    await expect(page.locator('ha-more-info-dialog'))
      .toContainText('Station rain')
  })
})
