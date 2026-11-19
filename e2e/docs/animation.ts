import { execFileSync, spawnSync } from 'node:child_process'
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
  await restartWeatherAnimation(page)
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

// An <img> SVG's SMIL timeline can't be seeked, but the image freezes at time 0 (image.animation_mode), so each frame shifts every begin by -t.
async function scrubIcons(page: Page, t: number): Promise<number[]> {
  return page.locator('clock-weather-card-icon > img')
    .evaluateAll(async (imgs: (HTMLImageElement & { svg?: string })[], t) => {
      const durations: number[] = []
      for (const img of imgs) {
        if (img.getAttribute('src') !== img.dataset.frame) {
          img.svg = await (await fetch(img.src)).text()
          img.dataset.start = String(t)
          const unsupported = img.svg.match(/<(animate\w*|set)\b(?![^>]*\bbegin="-?[\d.]+s")[^>]*>/)
          if (unsupported) throw new Error(`Unsupported SMIL timing in ${img.src}: ${unsupported[0]}`)
          for (const [, value, unit] of img.svg.matchAll(/\bdur="([\d.]+)(ms|s)?"/g)) {
            durations.push(Math.round(Number(value) * (unit === 'ms' ? 1 : 1000)))
          }
        }
        const elapsed = (t - Number(img.dataset.start)) / 1000
        const frame = img.svg!.replace(/\bbegin="(-?[\d.]+)s"/g, (_, begin: string) => `begin="${(Number(begin) - elapsed).toFixed(3)}s"`)
        img.src = img.dataset.frame = `data:image/svg+xml,${encodeURIComponent(frame)}`
        await img.decode()
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

// weather_animation ran on real time until now; remounting restarts its seeded scene on the virtual timeline. The fake clock
// fires animation frames on a 16ms grid of absolute time, so the restart is aligned to it, otherwise the physics would step
// at a different phase relative to the GIF frames on every run.
async function restartWeatherAnimation(page: Page): Promise<void> {
  const animations = page.locator('clock-weather-card-weather-animation')
  if (!await animations.count()) return
  const phase = await page.evaluate(() => performance.now() % 16)
  if (phase) await page.clock.runFor(16 - phase)
  await animations.evaluateAll(els => els.forEach(el => el.parentNode!.insertBefore(el, el.nextSibling)))
}

// Minimum average PSNR between two renders of a preview to count as the same animation. Rendering the weather
// animation twice gives ~44 dB (tiny rasterization noise that the GIF palette spreads across the whole image);
// a genuinely different animation scores ~30 dB.
const SAME_ANIMATION_DB = 38

export function sameAnimation(a: Buffer, b: Buffer): boolean {
  if (a.equals(b)) return true
  const dir = mkdtempSync(path.join(os.tmpdir(), 'preview-compare-'))
  try {
    const [fileA, fileB] = [a, b].map((gif, i) => {
      const file = path.join(dir, `${i}.gif`)
      writeFileSync(file, gif)
      return file
    })
    // psnr prints its summary to stderr. Different frame counts or sizes print no average: not the same animation.
    const { stderr } = spawnSync('ffmpeg', ['-v', 'info', '-hide_banner', '-i', fileA, '-i', fileB, '-lavfi', '[0][1]psnr', '-f', 'null', '-'], { encoding: 'utf-8' })
    return psnrAverage(stderr) >= SAME_ANIMATION_DB
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const psnrAverage = (ffmpegOutput: string): number => {
  const match = /average:(inf|[\d.]+)/.exec(ffmpegOutput)
  if (!match) return 0
  return match[1] === 'inf' ? Infinity : Number(match[1])
}
