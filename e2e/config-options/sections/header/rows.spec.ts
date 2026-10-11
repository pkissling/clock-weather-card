import type { Locator } from '@playwright/test'

import { expect, test } from '../../../utils/fixtures'
import api from '../../../utils/ha-api'

// TODO: cover more rows variations - empty rows, font_size, mixed segment types per row,
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

    // Row 1: thermometer icon, temperature, spacer, weather state.
    const firstRow = clockWeatherCard.locator('clock-weather-card-header-details-row')
      .first()
    await expect(firstRow.locator('> *'))
      .toHaveCount(4)
    await expect(firstRow.locator('clock-weather-card-icon-segment ha-icon[icon="mdi:thermometer"]'))
      .toHaveCount(1)
    await expect(firstRow)
      .toContainText('21')
    await expect(firstRow.locator('clock-weather-card-weather-icon-segment'))
      .toHaveCount(0)
    await expect(firstRow)
      .toContainText('Sunny')

    // Row 2: centered time. UTC 15:30 → Europe/Berlin (HA default tz, CEST) 17:30 → en TIME_SIMPLE.
    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveText('5:30 PM')

    // Row 3: centered calendar icon and date.
    await expect(clockWeatherCard.locator('clock-weather-card-icon-segment ha-icon[icon="mdi:calendar"]'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-date-segment'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-date-segment'))
      .toHaveText('April 27, 2026')

    await expect(clockWeatherCard.locator('clock-weather-card-spacer-segment'))
      .toHaveCount(1)

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
    // Custom row 2: yyyy-MM-dd date - assert exact format
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
      .toContain('Config option "sections.header.rows[1].segments[1].type" has invalid value "clock", expected one of "time", "date", "weather", "entity", "icon", "weather_icon", "text", "spacer"')
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(0)
  })

  const alignedRowConfig = (alignment: string): string => `
    sections:
      header:
        rows:
          - segments:
              - type: text
                text: A row much wider than the aligned one
          - alignment: ${alignment}
            segments:
              - type: text
                text: Short
  `
  type Box = Awaited<ReturnType<Locator['boundingBox']>>
  const alignedBoxes = (clockWeatherCard: Locator): Promise<[Box, Box]> => Promise.all([
    clockWeatherCard.locator('clock-weather-card-header-details-row')
      .nth(1)
      .boundingBox(),
    clockWeatherCard.locator('clock-weather-card-text-segment')
      .nth(1)
      .boundingBox(),
  ])

  test('alignment: center centers the row\'s segments', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: alignedRowConfig('center') })
    const [row, segment] = await alignedBoxes(clockWeatherCard)

    expect(segment!.x - row!.x)
      .toBeCloseTo(row!.x + row!.width - segment!.x - segment!.width, 0)
    expect(segment!.x)
      .toBeGreaterThan(row!.x + 1)
  })

  test('alignment: right moves the row\'s segments to the right edge', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: alignedRowConfig('right') })
    const [row, segment] = await alignedBoxes(clockWeatherCard)

    expect(segment!.x + segment!.width)
      .toBeCloseTo(row!.x + row!.width, 0)
  })

  test('alignment: right stays on the right edge in an RTL language', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ language: 'he', cardConfig: alignedRowConfig('right') })
    const [row, segment] = await alignedBoxes(clockWeatherCard)

    expect(segment!.x + segment!.width)
      .toBeCloseTo(row!.x + row!.width, 0)
  })

  test('alignment: left stays on the left edge in an RTL language', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ language: 'he', cardConfig: alignedRowConfig('left') })
    const [row, segment] = await alignedBoxes(clockWeatherCard)

    expect(segment!.x)
      .toBeCloseTo(row!.x, 0)
  })

  test('rejects an unknown row alignment', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: alignedRowConfig('middle') })

    await cardErrorMessage()
      .toContain('Config option "sections.header.rows[1].alignment" has invalid value "middle", expected one of "left", "center", "right"')
  })

  test('renders a text segment with its static text', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: text
                    text: Hello world
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-text-segment'))
      .toHaveText('Hello world')
  })

  test('rejects a text segment without a string text', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: text
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.header.rows[0].segments[0].text" has invalid value "undefined", expected a string')
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

  for (const [type, extra, entityId] of [['weather', 'attribute: humidity', 'weather.mock_weather'], ['entity', 'entity_id: sensor.demo', 'sensor.demo']]) {

    test(`rejects a non-string ${type} segment unit`, async ({ setupCard, cardErrorMessage }) => {
      await api.setEntityState('sensor.demo', '42')
      await setupCard({
        cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: ${type}
                    ${extra}
                    unit: [ '%' ]
      `,
      })

      await cardErrorMessage()
        .toContain('Config option "sections.header.rows[0].segments[0].unit" has invalid value "%", expected a string')
    })

    test(`rejects a ${type} segment unit combined with show_unit: false`, async ({ setupCard, cardErrorMessage }) => {
      await api.setEntityState('sensor.demo', '42')
      await setupCard({
        cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: ${type}
                    ${extra}
                    unit: '%'
                    show_unit: false
      `,
      })

      await cardErrorMessage()
        .toContain('Config option "sections.header.rows[0].segments[0].unit" requires "sections.header.rows[0].segments[0].show_unit" to be "true"')
    })

    test(`rejects a non-string ${type} segment unit_attribute`, async ({ setupCard, cardErrorMessage }) => {
      await api.setEntityState('sensor.demo', '42')
      await setupCard({
        cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: ${type}
                    ${extra}
                    unit_attribute: [ foo ]
      `,
      })

      await cardErrorMessage()
        .toContain('Config option "sections.header.rows[0].segments[0].unit_attribute" has invalid value "foo", expected a string')
    })

    test(`rejects a ${type} segment unit_attribute that is missing on the entity`, async ({ setupCard, cardErrorMessage }) => {
      await api.setEntityState('sensor.demo', '42')
      await setupCard({
        cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: ${type}
                    ${extra}
                    unit_attribute: missing
      `,
      })

      await cardErrorMessage()
        .toContain(`Config option "sections.header.rows[0].segments[0].unit_attribute" has invalid value "missing", expected an attribute of "${entityId}"`)
    })
  }

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

  test.describe('weather segment', () => {
    test('appends % to humidity', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { humidity: 50 },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: humidity
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('50%')
    })

    test('appends temperature_unit to temperature', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { temperature: 21 },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: temperature
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('21°C')
    })

    test('appends temperature_unit to dew_point', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { dew_point: 12 },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: dew_point
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('12°C')
    })

    test('falls back to <attribute>_unit for unknown attributes', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { extra_attributes: { foo: 5, foo_unit: 'x' } },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: foo
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('5x')
    })

    test('renders unknown attributes without unit when <attribute>_unit is missing', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { extra_attributes: { bar: 7 } },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: bar
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('7')
    })

    test('prefers the configured unit over the known unit', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { humidity: 50 },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: humidity
                      unit: ' %rH'
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('50 %rH')
    })

    test('prefers the configured unit over <attribute>_unit', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { temperature: 21 },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: temperature
                      unit: ' K'
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('21 K')
    })

    test('uses unit_attribute when configured (overrides the known unit)', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { humidity: 50, extra_attributes: { humidity_scale: 'g/m³' } },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: humidity
                      unit_attribute: humidity_scale
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('50g/m³')
    })

    test('converts values whose unit_attribute is a temperature unit', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { extra_attributes: { soil: 50, soil_scale: '°F' } },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: soil
                      unit_attribute: soil_scale
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('10°C')
    })

    test('show_unit: false hides the unit', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        weather: { humidity: 50 },
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: weather
                      attribute: humidity
                      show_unit: false
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-segment'))
        .toHaveText('50')
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

    test('prefers the configured unit over unit_of_measurement', async ({ setupCard, clockWeatherCard }) => {
      await api.setEntityState('sensor.demo', '42', { unit_of_measurement: 'W' })
      await setupCard({
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: entity
                      entity_id: sensor.demo
                      unit: ' kW'
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('42 kW')
    })

    test('prefers the configured unit over the converted temperature unit', async ({ setupCard, clockWeatherCard }) => {
      await api.setEntityState('sensor.demo', '50', { unit_of_measurement: '°F' })
      await setupCard({
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: entity
                      entity_id: sensor.demo
                      unit: ' deg'
        `,
      })

      await expect(clockWeatherCard.locator('clock-weather-card-entity-segment'))
        .toHaveText('10 deg')
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

    test('rejects an attribute that is missing on the entity', async ({ setupCard, cardErrorMessage }) => {
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

      await cardErrorMessage()
        .toContain('Config option "sections.header.rows[0].segments[0].attribute" has invalid value "missing", expected an attribute of "sensor.demo"')
    })

    test('rejects an entity_id that does not exist', async ({ setupCard, cardErrorMessage }) => {
      await setupCard({
        cardConfig: `
          sections:
            header:
              rows:
                - segments:
                    - type: entity
                      entity_id: sensor.does_not_exist
        `,
      })

      await cardErrorMessage()
        .toContain('Referenced entity "sensor.does_not_exist" does not exist')
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
