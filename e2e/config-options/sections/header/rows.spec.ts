import { expect, test } from '../../../utils/fixtures'
import api from '../../../utils/ha-api'

// TODO: cover more rows variations — empty rows, font_size, mixed segment types per row,
// reordering segments within a row, missing optional segment fields.
test.describe('sections.header.rows', () => {
  test('renders the default 3 rows when rows is omitted', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: new Date('2026-04-27T15:30:00Z'),
      weather: { state: 'sunny', temperature: 21 },
    })

    // 3 rows.
    await expect(clockWeatherCard.locator('clock-weather-card-header-details-row'))
      .toHaveCount(3)

    // Row 1: thermometer icon, temperature, spacer, weather state, weather icon.
    await expect(clockWeatherCard.locator('clock-weather-card-icon-segment ha-icon[icon="mdi:thermometer"]'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-weather-icon-segment ha-icon[icon="mdi:weather-sunny"]'))
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
        sections:
          header:
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

  test('rejects an unknown segment type', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: time
              - segments:
                  - type: spacer
                  - type: clock
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.header.rows[1].segments[1].type" has invalid value "clock", expected one of "time", "date", "weather", "entity", "icon", "weather_icon", "spacer"')
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(0)
  })

  test('rejects a non-boolean segment show_unit', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: weather
                    show_unit: fals
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.header.rows[0].segments[0].show_unit" has invalid value "fals", expected true or false')
  })

  test('updates rows at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
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
        sections:
          header:
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
          sections:
            header:
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
          sections:
            header:
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
          sections:
            header:
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
          sections:
            header:
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
          sections:
            header:
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
          sections:
            header:
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
          sections:
            header:
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
          sections:
            header:
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
          sections:
            header:
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

  test.describe('weather_icon segment', () => {
    const weatherIcon = 'clock-weather-card-weather-icon-segment ha-icon'
    const configWith = (extra = ''): string => `
      sections:
        header:
          rows:
            - segments:
                - type: weather_icon
                  ${extra}
    `
    const config = configWith()

    test('renders the MDI icon of the current weather state', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: config, weather: { state: 'fog' } })

      await expect(clockWeatherCard.locator(weatherIcon))
        .toHaveAttribute('icon', 'mdi:weather-fog')
    })

    test('follows the weather state at runtime (no reload)', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: config, weather: { state: 'rainy' } })
      await expect(clockWeatherCard.locator(weatherIcon))
        .toHaveAttribute('icon', 'mdi:weather-rainy')

      await setupCard({ cardConfig: config, weather: { state: 'snowy' } })

      await expect(clockWeatherCard.locator(weatherIcon))
        .toHaveAttribute('icon', 'mdi:weather-snowy')
    })

    test('switches to the night variant when the sun sets', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: config, weather: { state: 'partlycloudy' }, sun: { state: 'above_horizon' } })
      await expect(clockWeatherCard.locator(weatherIcon))
        .toHaveAttribute('icon', 'mdi:weather-partly-cloudy')

      await api.setEntityState('sun.sun', 'below_horizon', { elevation: -10 })

      await expect(clockWeatherCard.locator(weatherIcon))
        .toHaveAttribute('icon', 'mdi:weather-night-partly-cloudy')
    })

    test('uses the configured entity_id instead of the card entity', async ({ setupCard, clockWeatherCard }) => {
      await api.setMockWeather({ entity_id: 'weather.mock_weather_2', condition: 'hail' })
      await setupCard({
        cardConfig: configWith('entity_id: weather.mock_weather_2'),
        weather: { state: 'sunny' },
      })

      await expect(clockWeatherCard.locator(weatherIcon))
        .toHaveAttribute('icon', 'mdi:weather-hail')
    })

    test('rejects an entity_id that does not exist', async ({ setupCard, cardErrorMessage }) => {
      await setupCard({
        cardConfig: configWith('entity_id: weather.does_not_exist'),
      })

      await cardErrorMessage()
        .toContain('Referenced entity "weather.does_not_exist" does not exist')
    })
  })
})
