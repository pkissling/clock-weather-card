import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import type { Page } from '@playwright/test'

export type Clip = { x: number, y: number, width: number, height: number }

const FPS = 25
const MAX_LOOP_MS = 12_000

// Frames are rendered on a virtual timeline, so the result is identical however slow the machine is.
export async function captureAnimation(
  page: Page,
  measureClip: () => Promise<Clip>,
  encode: boolean,
): Promise<Buffer | undefined> {
  const start = await page.evaluate(() => Date.now())
  // The fixed time set by setupCard stays, so the clock doesn't tick and the GIF loops seamlessly.
  await page.clock.pauseAt(start)

  const durations = await scrubIcons(page, 0)
  // Measured after the icon swap, which can shift the layout.
  const clip = await measureClip()
  const frameCount = Math.round(loopDuration(durations) * FPS / 1000)
  const dir = mkdtempSync(path.join(os.tmpdir(), 'preview-frames-'))
  try {
    let elapsed = 0
    for (let frame = 0; frame < frameCount; frame++) {
      const t = Math.round(frame * 1000 / FPS)
      await page.clock.runFor(t - elapsed)
      elapsed = t
      await scrubIcons(page, t)
      if (encode) writeFileSync(path.join(dir, `${String(frame)
        .padStart(4, '0')}.png`), await page.screenshot({ clip }))
    }
    if (!encode) return undefined
    return execFileSync('ffmpeg', [
      '-v', 'error',
      '-framerate', String(FPS),
      '-i', path.join(dir, '%04d.png'),
      '-filter_complex', '[0]split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=floyd_steinberg:diff_mode=rectangle',
      '-f', 'gif',
      '-',
    ], { maxBuffer: 64 * 1024 * 1024 })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// An <img> SVG's SMIL timeline can't be controlled, so each icon is swapped for an inline copy that can be seeked.
async function scrubIcons(page: Page, t: number): Promise<number[]> {
  return page.locator('clock-weather-card-icon > img')
    .evaluateAll(async (imgs: HTMLImageElement[], t) => {
      const durations: number[] = []
      for (const img of imgs) {
        let svg = img.nextElementSibling as SVGSVGElement | null
        if (svg?.dataset.src !== img.src) {
          svg?.remove()
          img.style.display = ''
          await img.decode()
          const text = await (await fetch(img.src)).text()
          svg = document.importNode(new DOMParser()
            .parseFromString(text, 'image/svg+xml').documentElement, true) as unknown as SVGSVGElement
          const { width, height } = img.getBoundingClientRect()
          Object.assign(svg.dataset, { src: img.src, start: String(t) })
          svg.setAttribute('width', String(width))
          svg.setAttribute('height', String(height))
          svg.style.display = getComputedStyle(img).display
          img.style.display = 'none'
          img.after(svg)
          svg.pauseAnimations()
          for (const el of svg.querySelectorAll('[dur]')) {
            const [, value, unit] = /^([\d.]+)(ms|s)?$/.exec(el.getAttribute('dur')!) ?? []
            if (value) durations.push(Math.round(Number(value) * (unit === 'ms' ? 1 : 1000)))
          }
        }
        svg.setCurrentTime((t - Number(svg.dataset.start)) / 1000)
      }
      return durations
    }, t)
}

export function loopDuration(durations: number[]): number {
  if (!durations.length) throw new Error('No animated icons visible')
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
  const lcm = durations.reduce((a, b) => a / gcd(a, b) * b)
  if (lcm > MAX_LOOP_MS) throw new Error(`Icons only loop after ${lcm}ms`)
  return lcm
}
