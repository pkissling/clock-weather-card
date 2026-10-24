import { expect, test } from '../utils/fixtures'

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

  test('opens the more-info dialog of the entity when omitted', async ({ page, setupCard }) => {
    const card = await setupCard()

    await card.locator('ha-card')
      .click()

    await expect(page.locator('ha-more-info-dialog'))
      .toContainText('Mock Weather')
  })

  for (const key of ['Enter', 'Space']) {
    test(`runs the configured action on ${key}`, async ({ page, setupCard }) => {
      const card = await setupCard({
        cardConfig: `
          tap_action:
            action: navigate
            navigation_path: '#tapped-${key}'
        `,
      })

      await card.locator('ha-card')
        .press(key)

      await expect(page)
        .toHaveURL(new RegExp(`#tapped-${key}$`))
    })
  }

  test('shows a focus outline on keyboard focus only', async ({ page, setupCard }) => {
    const card = await setupCard({ cardConfig: 'tap_action: { action: navigate, navigation_path: \'#focus\' }' })
    const haCard = card.locator('ha-card')

    await haCard.click()
    await expect(haCard)
      .toHaveCSS('outline-style', 'none')

    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(haCard)
      .toBeFocused()
    await expect(haCard)
      .toHaveCSS('outline-style', 'solid')
    await expect(haCard)
      .toHaveCSS('outline-width', '2px')
  })
})

test.describe('tap_action validation and none', () => {
  test('is not clickable with action none', async ({ setupCard }) => {
    const card = await setupCard({ cardConfig: 'tap_action: { action: none }' })

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
