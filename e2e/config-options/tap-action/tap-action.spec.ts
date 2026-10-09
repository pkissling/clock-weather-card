import { expect, test } from '../../utils/fixtures'

test.describe('tap_action', () => {
  test.use({ freshPage: true })

  test('runs the configured action when the card is clicked', async ({ page, setupCard }) => {
    const card = await setupCard({
      cardConfig: `
        tap_action:
          action: navigate
          navigation_path: '#tapped'
      `,
    })

    await card.locator('ha-card')
      .click()

    await expect(page)
      .toHaveURL(/#tapped$/)
  })

  test('runs the configured action on Enter', async ({ page, setupCard }) => {
    const card = await setupCard({
      cardConfig: `
        tap_action:
          action: navigate
          navigation_path: '#tapped'
      `,
    })

    await card.locator('ha-card')
      .press('Enter')

    await expect(page)
      .toHaveURL(/#tapped$/)
  })
})

test.describe('tap_action without action', () => {
  test('is not clickable when omitted', async ({ setupCard }) => {
    const card = await setupCard()

    await expect(card.locator('ha-card')).not.toHaveAttribute('role', 'button')
    await expect(card.locator('ha-card'))
      .toHaveCSS('cursor', 'auto')
  })

  test('stops being clickable when switched to action none at runtime (no reload)', async ({ setupCard }) => {
    const card = await setupCard({ cardConfig: 'tap_action: { action: more-info }' })
    await expect(card.locator('ha-card'))
      .toHaveAttribute('role', 'button')

    await setupCard({ cardConfig: 'tap_action: { action: none }' })

    await expect(card.locator('ha-card'))
      .not.toHaveAttribute('role', 'button')
  })

  test('rejects an unknown action', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'tap_action: { action: fly }' })

    await cardErrorMessage()
      .toContain('Config option "tap_action.action" has invalid value "fly", expected one of')
  })

  test('rejects a value without action', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'tap_action: navigate' })

    await cardErrorMessage()
      .toContain('Config option "tap_action" has invalid value "navigate", expected an object with an "action"')
  })
})
