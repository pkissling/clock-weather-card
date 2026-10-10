import { openEditor, saveEditor } from '../utils/editor'
import { expect, test } from '../utils/fixtures'

test.describe('GUI editor', () => {
  test.use({ freshPage: true })

  test('sets the title', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByRole('textbox', { name: 'Title' })
      .fill('My Weather')

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', title: 'My Weather' })
  })

  test('hides a section', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.locator('[data-section=forecast_strip] ha-switch')
      .click()

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', sections: { forecast_strip: { hide: true } } })
  })

  test('drops the hide option when a section is shown again', async ({ page, setupCard }) => {
    await setupCard({ cardConfig: 'sections: { forecast_strip: { hide: true } }' })
    const editor = await openEditor(page)

    await editor.locator('[data-section=forecast_strip] ha-switch')
      .click()

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather' })
  })

  test('changes section options', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Forecast list')
      .click()
    await editor.getByRole('radio', { name: 'Hourly' })
      .click()
    await editor.getByRole('spinbutton', { name: 'Number of entries' })
      .fill('8')

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', sections: { forecast_list: { forecast_type: 'hourly', count: 8 } } })
  })

  test('adds a text segment to a header row', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Header')
      .click()
    await editor.locator('[data-row="2"]')
      .getByRole('button', { name: 'Add segment' })
      .click()
    await editor.locator('[data-add=text]')
      .click()
    await editor.getByRole('textbox', { name: 'Text' })
      .fill('Hello')

    const config = await saveEditor(page)
    expect((config.sections as { header: { rows: unknown[] } }).header.rows[2])
      .toEqual({ alignment: 'center', segments: [{ type: 'icon', icon: 'mdi:calendar' }, { type: 'date' }, { type: 'text', text: 'Hello' }] })
  })

  test('picks a date format from previews', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Header')
      .click()
    await editor.locator('[data-segment=date]')
      .click()
    await editor.getByLabel('Date format')
      .click()
    await editor.getByText('2025-09-14 · yyyy-MM-dd')
      .click()

    const config = await saveEditor(page)
    expect((config.sections as { header: { rows: { segments: unknown[] }[] } }).header.rows[2].segments[1])
      .toEqual({ type: 'date', date_pattern: 'yyyy-MM-dd' })
  })

  test('picks a forecast strip time format from previews', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Forecast strip')
      .click()
    await editor.getByText('More options')
      .click()
    await editor.getByLabel('Time format')
      .click()
    await editor.getByText('4 PM · h a')
      .click()

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', sections: { forecast_strip: { time_pattern: 'h a' } } })
  })

  test('offers the forecast list time format only for hourly forecasts', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Forecast list')
      .click()
    await editor.getByText('More options')
      .click()
    await expect(editor.getByLabel('Time format'))
      .toHaveCount(0)
    await editor.getByRole('radio', { name: 'Hourly' })
      .click()
    await expect(editor.getByLabel('Time format'))
      .toBeVisible()
  })

  test('resets header rows to the default', async ({ page, setupCard }) => {
    await setupCard({ cardConfig: 'sections: { header: { rows: [{ segments: [{ type: time }] }] } }' })
    const editor = await openEditor(page)

    await editor.getByText('Header')
      .click()
    await editor.getByRole('button', { name: 'Reset to default' })
      .click()

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather' })
  })

  test('adds a gradient stop', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Forecast list')
      .click()
    await editor.getByText('More options')
      .click()
    await editor.getByRole('button', { name: 'Add color stop' })
      .click()
    await expect(editor.locator('[data-stop="50"]'))
      .toBeVisible()

    const config = await saveEditor(page)
    expect((config.sections as { forecast_list: { gradient: Record<string, string> } }).forecast_list.gradient)
      .toMatchObject({ 40: '#FFC09F', 50: '#FFC09F' })
  })

  test('edits a gradient color as hex', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Forecast list')
      .click()
    await editor.getByText('More options')
      .click()
    await editor.getByRole('textbox', { name: 'Color gradient 40' })
      .fill('#ff0000')

    const config = await saveEditor(page)
    expect((config.sections as { forecast_list: { gradient: Record<string, string> } }).forecast_list.gradient)
      .toMatchObject({ 30: '#FF964F', 40: '#ff0000' })
  })

  test('picks the weather icon style', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Appearance')
      .click()
    await editor.getByRole('radio', { name: 'Fill' })
      .click()

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', weather_icon_type: 'fill' })
  })

  test('picks the attribute color', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Forecast strip')
      .click()
    await editor.getByText('More options')
      .click()
    await editor.getByRole('textbox', { name: 'Attribute color' })
      .fill('#4a90d9')

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', sections: { forecast_strip: { attribute_color: '#4a90d9' } } })
  })

  test('clearing the attribute color restores the default', async ({ page, setupCard }) => {
    await setupCard({ cardConfig: 'sections: { forecast_strip: { attribute_color: "#ff0000" } }' })
    const editor = await openEditor(page)

    await editor.getByText('Forecast strip')
      .click()
    await editor.getByText('More options')
      .click()
    await editor.getByRole('textbox', { name: 'Attribute color' })
      .fill('')

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather' })
  })

  test('shows the color picked from the gradient as hex', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Forecast strip')
      .click()
    await editor.getByText('More options')
      .click()
    await editor.locator('clock-weather-card-color-picker .hues')
      .click()

    await expect(editor.getByRole('textbox', { name: 'Attribute color' }))
      .toHaveValue(/^#[0-9a-f]{6}$/)
  })

  test('marks the current color on the gradient', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Forecast strip')
      .click()
    await editor.getByText('More options')
      .click()

    await expect(editor.locator('clock-weather-card-color-picker .marker'))
      .toBeVisible()
  })

  test('preselects the defaults of Home Assistant', async ({ page, setupCard }) => {
    await setupCard({ unitSystem: 'us_customary' })
    const editor = await openEditor(page)

    await editor.getByText('Appearance')
      .click()

    await expect(editor.getByRole('radio', { name: 'Fahrenheit' }))
      .toBeChecked()
    await expect(editor.getByRole('radio', { name: 'Line' }))
      .toBeChecked()
  })

  test('sets the bar thickness with a slider', async ({ page, setupCard }) => {
    await setupCard()
    const editor = await openEditor(page)

    await editor.getByText('Forecast list')
      .click()
    await editor.getByText('More options')
      .click()
    await editor.getByRole('slider')
      .press('ArrowLeft')

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', sections: { forecast_list: { bar_thickness: '55%' } } })
  })

  test('keeps options it did not touch', async ({ page, setupCard }) => {
    await setupCard({ cardConfig: 'sections: { forecast_list: { count: 7, gradient: { 0: "#000000", 30: "#ffffff" } } }' })
    const editor = await openEditor(page)

    await editor.getByRole('textbox', { name: 'Title' })
      .fill('Kept')

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', title: 'Kept', sections: { forecast_list: { count: 7, gradient: { 0: '#000000', 30: '#ffffff' } } } })
  })
})
