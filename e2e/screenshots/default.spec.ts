import { expect, test } from '../utils/fixtures'

test('default config', async ({ setupCard, clockWeatherCard }) => {
  await setupCard({})
  await expect(clockWeatherCard)
    .toHaveScreenshot()
})

// Phones only differ by the card width and, with Android's font scaling, the root font size.
for (const { name, fontScale } of [
  { name: 'default config on a phone', fontScale: 1 },
  { name: 'default config on a phone with large text', fontScale: 1.3 },
]) {
  test(name, async ({ page, setupCard, clockWeatherCard }) => {
    await setupCard({})
    const rootFontSize = await page.evaluate(() => document.documentElement.style.fontSize)
    try {
      await page.evaluate(scale => { document.documentElement.style.fontSize = `${16 * scale}px` }, fontScale)
      await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = 'display: block; width: 360px' })
      await expect(clockWeatherCard)
        .toHaveScreenshot()
    } finally {
      await page.evaluate(size => { document.documentElement.style.fontSize = size }, rootFontSize)
      await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = '' })
    }
  })
}
