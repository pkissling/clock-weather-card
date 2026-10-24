import type { Page } from '@playwright/test'

import { expect, test } from '../utils/fixtures'
import { captureAnimation, type Clip } from './animation'
import { collectPreviews, previewFile } from './previews'
import { installThemes } from './themes'

const previews = collectPreviews()
// Leaves the theme's background visible around the card's rounded corners.
const PADDING = 8

test.beforeAll(async () => {
  await installThemes(previews.flatMap(p => p.theme ? [p.theme] : []))
})

for (const preview of previews) {
  test(preview.name, async ({ page, setupCard, cardErrorMessage }, testInfo) => {
    test.setTimeout(120_000)
    await page.emulateMedia({ colorScheme: preview.dark ? 'dark' : 'light' })
    const card = await setupCard({ ...preview.mock, entities: preview.entities, theme: preview.theme?.name, cardConfig: preview.cardConfig })
    await cardErrorMessage()
      .toBeNull()
    await waitForBackgroundImages(page)
    // The theme only applies to the view, so HA's toolbar would show in the padding above the card.
    await page.locator('hui-root .header')
      .evaluate((el: HTMLElement) => { el.style.visibility = 'hidden' })

    const measureClip = async (): Promise<Clip> => {
      const box = (await card.boundingBox())!
      return { x: box.x - PADDING, y: box.y - PADDING, width: box.width + 2 * PADDING, height: box.height + 2 * PADDING }
    }
    if (!preview.animated) {
      await expect(page)
        .toHaveScreenshot(previewFile(preview), { clip: await measureClip(), scale: 'device' })
      return
    }
    const gif = await captureAnimation(page, measureClip, !testInfo.project.ignoreSnapshots)
    if (gif) expect(gif)
      .toMatchSnapshot(previewFile(preview))
  })
}

// Theme backgrounds load asynchronously and would otherwise pop in mid-animation.
async function waitForBackgroundImages(page: Page): Promise<void> {
  await page.locator('*')
    .evaluateAll(els => Promise.all(els
      .flatMap(e => [...getComputedStyle(e).backgroundImage.matchAll(/url\("(.+?)"\)/g)])
      .map(([, src]) => Object.assign(new Image(), { src })
        .decode()
        .catch(() => { throw new Error(`Background image ${src} failed to load`) }))))
}
