import { expect, test } from '../../utils/fixtures'
import api from '../../utils/ha-api'

// TODO: cover more rows variations — empty rows, font_size, mixed segment types per row,
// reordering segments within a row, missing optional segment fields.
test.describe('rows', () => {
  test('renders the default 3 rows when rows is omitted', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: new Date('2026-04-27T15:30:00Z'),
      weather: { state: 'sunny', temperature: 21 },
    })

    // 3 rows.
    await expect(clockWeatherCard.locator('clock-weather-card-today-details-row'))
      .toHaveCount(3)

    // Row 1: thermometer icon, temperature, spacer, weather state, weather-cloudy icon.
    await expect(clockWeatherCard.locator('clock-weather-card-icon-segment ha-icon[icon="mdi:thermometer"]'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-icon-segment ha-icon[icon="mdi:weather-partly-cloudy"]'))
      .toHaveCount(1)
    await expect(clockWeatherCard)
      .toContainText('21')
    await expect(clockWeatherCard)
      .toContainText('Sunny')

    // Row 2: spacer, time, spacer. UTC 15:30 → Europe/Berlin (HA default tz, CEST) 17:30 → en TIME_SIMPLE.
    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveText('5:30 PM')

    // Row 3: spacer, calendar icon, date, spacer.
    await expect(clockWeatherCard.locator('clock-weather-card-icon-segment ha-icon[icon="mdi:calendar"]'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-date-segment'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-date-segment'))
      .toHaveText('April 27, 2026')

    // 1 spacer in row 1 + 2 in row 2 + 2 in row 3 = 5 total.
    await expect(clockWeatherCard.locator('clock-weather-card-spacer-segment'))
      .toHaveCount(5)
  })

  test('renders a custom rows config with the configured segments in order', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        rows:
          - segments:
              - type: time
                time_pattern: HH:mm
          - segments:
              - type: date
                date_pattern: yyyy-MM-dd
          - segments:
              - type: weather
                attribute: temperature
                show_unit: false
      `,
      date: new Date('2026-04-27T15:30:00Z'),
      weather: { temperature: 21 },
    })

    // Custom row 1: time only
    await expect(clockWeatherCard)
      .toContainText(/\d{2}:\d{2}/)
    // Custom row 2: yyyy-MM-dd date — assert exact format
    await expect(clockWeatherCard)
      .toContainText('2026-04-27')
    // Custom row 3: numeric weather attribute (regression: getEntityAttribute must return numbers)
    await expect(clockWeatherCard)
      .toContainText('21')
  })

  test('updates rows at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        rows:
          - segments:
              - type: time
                time_pattern: HH:mm
      `,
    })
    // Initial: only a time segment.
    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-date-segment'))
      .toHaveCount(0)

    await setupCard({
      cardConfig: `
        rows:
          - segments:
              - type: date
                date_pattern: yyyy-MM-dd
      `,
    })

    // After update: the time segment is gone; a date segment appears.
    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-date-segment'))
      .toHaveCount(1)
  })

  test.describe('time segment', () => {
    test('renders seconds when time_pattern includes ss', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        cardConfig: `
          rows:
            - segments:
                - type: time
                  time_pattern: HH:mm:ss
        `,
        date: new Date('2025-06-15T12:00:30Z'),
      })

      await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
        .toContainText(/\d{2}:\d{2}:\d{2}/)
    })
  })

  test.describe('entity segment', () => {
    test('renders entity state with the entity\'s unit_of_measurement', async ({ setupCard, clockWeatherCard }) => {
      await api.setEntityState('sensor.demo', '42', { unit_of_measurement: '°C' })
      await setupCard({
        cardConfig: `
          rows:
            - segments:
                - type: entity
                  entity_id: sensor.demo
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('42°C')
    })

    test('renders an attribute value with the entity\'s unit_of_measurement', async ({ setupCard, clockWeatherCard }) => {
      await api.setEntityState('sensor.demo', 'on', { brightness: 75, unit_of_measurement: '%' })
      await setupCard({
        cardConfig: `
          rows:
            - segments:
                - type: entity
                  entity_id: sensor.demo
                  attribute: brightness
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('75%')
    })

    test('uses unit_attribute when configured (overrides unit_of_measurement)', async ({ setupCard, clockWeatherCard }) => {
      await api.setEntityState('sensor.demo', '42', { unit_of_measurement: '°C', custom_unit: 'kWh' })
      await setupCard({
        cardConfig: `
          rows:
            - segments:
                - type: entity
                  entity_id: sensor.demo
                  unit_attribute: custom_unit
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('42kWh')
    })

    test('renders state without unit when configured unit_attribute is missing on the entity', async ({ setupCard, clockWeatherCard }) => {
      await api.setEntityState('sensor.demo', '42', { unit_of_measurement: '°C' })
      await setupCard({
        cardConfig: `
          rows:
            - segments:
                - type: entity
                  entity_id: sensor.demo
                  unit_attribute: not_there
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('42')
    })

    test('show_unit: false hides the unit', async ({ setupCard, clockWeatherCard }) => {
      await api.setEntityState('sensor.demo', '42', { unit_of_measurement: '°C' })
      await setupCard({
        cardConfig: `
          rows:
            - segments:
                - type: entity
                  entity_id: sensor.demo
                  show_unit: false
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('42')
    })

    test('renders state without unit when entity has no unit_of_measurement', async ({ setupCard, clockWeatherCard }) => {
      await api.setEntityState('sensor.demo', 'on', {})
      await setupCard({
        cardConfig: `
          rows:
            - segments:
                - type: entity
                  entity_id: sensor.demo
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('on')
    })

    test('renders nothing when the configured attribute is missing on the entity', async ({ setupCard, clockWeatherCard }) => {
      await api.setEntityState('sensor.demo', 'on', { unit_of_measurement: '%' })
      await setupCard({
        cardConfig: `
          rows:
            - segments:
                - type: entity
                  entity_id: sensor.demo
                  attribute: missing
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('')
    })

    test('renders numeric attribute values', async ({ setupCard, clockWeatherCard }) => {
      // Regression: getEntityAttribute used to filter to string|null, dropping numbers.
      await api.setEntityState('sensor.demo', 'on', { count: 7 })
      await setupCard({
        cardConfig: `
          rows:
            - segments:
                - type: entity
                  entity_id: sensor.demo
                  attribute: count
                  show_unit: false
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('7')
    })
  })
})
