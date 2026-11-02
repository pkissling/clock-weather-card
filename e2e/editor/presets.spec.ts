import type { Locator } from '@playwright/test'

import { PRESETS } from '../../src/editor/presets'
import { openEditor, saveEditor } from '../utils/editor'
import { expect, test } from '../utils/fixtures'

const pickLayout = async (editor: Locator, name: string): Promise<void> => {
  await editor.getByText('Start from a layout')
    .click()
  await editor.page()
    .getByRole('menuitem', { name, exact: true })
    .click()
}

test.describe('GUI editor starter layouts', () => {
  test.use({ freshPage: true })

  test('applies a layout right away while the sections are unchanged', async ({ page, setupCard }) => {
    await setupCard({ cardConfig: 'title: Home' })
    const editor = await openEditor(page)

    await pickLayout(editor, 'Classic')

    await expect(editor.getByRole('alert'))
      .toHaveCount(0)
    await expect(editor.locator('[data-section=forecast_strip]'))
      .toHaveClass(/hidden/)
    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', title: 'Home', sections: PRESETS.classic })
  })

  test('asks before replacing customized sections', async ({ page, setupCard }) => {
    await setupCard({ cardConfig: 'sections: { forecast_list: { count: 3 } }' })
    const editor = await openEditor(page)

    await pickLayout(editor, 'Minimal clock')
    const alert = editor.getByRole('alert')
    await expect(alert)
      .toContainText('This replaces the header rows and all section options.')
    await alert.getByRole('button', { name: 'Cancel' })
      .click()
    await expect(alert)
      .toHaveCount(0)

    await pickLayout(editor, 'Compact')
    await alert.getByRole('button', { name: 'Replace' })
      .click()
    await expect(alert)
      .toHaveCount(0)
    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather', sections: PRESETS.compact })
  })

  test('the default layout removes all section options', async ({ page, setupCard }) => {
    await setupCard({ cardConfig: 'sections: { forecast_strip: { hide: true } }' })
    const editor = await openEditor(page)

    await pickLayout(editor, 'Default')
    await editor.getByRole('alert')
      .getByRole('button', { name: 'Replace' })
      .click()

    expect(await saveEditor(page))
      .toEqual({ entity: 'weather.mock_weather' })
  })
})
