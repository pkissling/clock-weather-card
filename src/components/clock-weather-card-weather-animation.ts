import type { PropertyValues, TemplateResult } from 'lit'
import { html } from 'lit'
import { property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import logger from '@/service/logger'
import { customElement } from '@/utils/custom-element'
import { BOLT_LIFE, createScene, DROP_LENGTH, DROPLET_LIFE, type Effects, type Scene, seededRandom, step, twinkle } from '@/utils/weather-scene'

// Simulated before the first frame so the card starts mid-shower instead of with an empty sky.
const PREWARM_SECONDS = 2
const MAX_FRAME_SECONDS = 0.05
const SUN_COLOR = [253, 184, 19]
const SUN_RAYS = 12

@customElement('clock-weather-card-weather-animation')
export class ClockWeatherCardWeatherAnimation extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public effects!: Effects
  @property({ type: Number }) public wind = 0
  private scene?: Scene
  private frame?: number
  private loop = 0
  private color = '#000'
  private resizeObserver?: ResizeObserver

  protected render(): TemplateResult {
    return html`<canvas></canvas>`
  }

  public connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('aria-hidden', 'true')
    // A reconnect restarts right away; the first connect has no canvas yet and waits for the observer's initial call.
    if (this.hasUpdated) this.reset()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.scene?.width !== this.clientWidth || this.scene.height !== this.clientHeight) this.reset()
    })
    this.resizeObserver.observe(this)
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.stop()
  }

  protected updated(changed: PropertyValues<this>): void {
    if (changed.has('effects') && changed.get('effects') !== undefined) this.reset()
    else if (changed.has('wind') && this.scene) this.scene.wind = this.wind
  }

  private reset(): void {
    const canvas = this.querySelector('canvas')
    const { clientWidth: width, clientHeight: height } = this
    if (!canvas || !width || !height) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.getContext('2d')
      ?.setTransform(ratio, 0, 0, ratio, 0, 0)
    this.color = getComputedStyle(this)
      .getPropertyValue('--primary-text-color')
      .trim() || '#000'

    this.scene = createScene(this.effects, width, height, this.wind, seededRandom(1))
    for (let t = 0; t < PREWARM_SECONDS; t += 1 / 60) step(this.scene, 1 / 60)
    this.draw()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (this.frame === undefined) {
      logger.debug('Starting weather animation', this.effects)
      this.start()
    }
  }

  private start(): void {
    // A callback can outlive cancelAnimationFrame (e.g. one queued before the page swapped its timers),
    // so every loop checks it is still the current one before stepping the scene.
    const loop = ++this.loop
    let last: number | undefined
    const tick = (now: number): void => {
      if (loop !== this.loop) return
      // Capped so a frame after a stall (background tab, slow tablet) doesn't teleport the particles.
      const dt = last === undefined ? 0 : Math.min((now - last) / 1000, MAX_FRAME_SECONDS)
      last = now
      if (this.scene) step(this.scene, dt)
      this.draw()
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
  }

  private stop(): void {
    this.loop++
    if (this.frame !== undefined) cancelAnimationFrame(this.frame)
    this.frame = undefined
  }

  private draw(): void {
    const ctx = this.querySelector('canvas')
      ?.getContext('2d')
    const scene = this.scene
    if (!ctx || !scene) return
    ctx.clearRect(0, 0, scene.width, scene.height)
    ctx.strokeStyle = this.color
    ctx.fillStyle = this.color
    if (scene.sun) this.drawSun(ctx, scene)

    for (const star of scene.stars) {
      ctx.globalAlpha = twinkle(star, scene.time)
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
      ctx.fill()
    }

    // All puffs go into one path, so overlapping puffs don't darken each other.
    ctx.globalAlpha = 0.14
    ctx.beginPath()
    for (const { x, y, r } of scene.clouds) {
      for (const [dx, dy, size] of [[-1.3, 0.25, 0.65], [-0.5, -0.15, 0.85], [0.4, -0.3, 1], [1.3, 0.2, 0.7], [0, 0.35, 0.8]]) {
        ctx.moveTo(x + dx * r + size * r, y + dy * r)
        ctx.arc(x + dx * r, y + dy * r, size * r, 0, Math.PI * 2)
      }
    }
    ctx.fill()

    ctx.globalAlpha = 0.16
    for (const band of scene.fog) {
      ctx.save()
      ctx.translate(band.x + band.w / 2, band.y)
      ctx.scale(band.w / band.h, 1)
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, band.h / 2)
      gradient.addColorStop(0, this.color)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.fillRect(-band.h / 2, -band.h / 2, band.h, band.h)
      ctx.restore()
    }
    ctx.fillStyle = this.color

    // Streaks point along the drop's velocity, so wind slants them.
    ctx.globalAlpha = 0.35
    ctx.lineWidth = 1
    ctx.beginPath()
    for (const drop of scene.drops) {
      const speed = Math.hypot(scene.wind, drop.vy) || 1
      ctx.moveTo(drop.x, drop.y)
      ctx.lineTo(drop.x - scene.wind / speed * DROP_LENGTH, drop.y - drop.vy / speed * DROP_LENGTH)
    }
    ctx.stroke()

    for (const droplet of scene.droplets) {
      ctx.globalAlpha = 0.5 * droplet.life / DROPLET_LIFE
      ctx.fillRect(droplet.x - 0.75, droplet.y - 1.5, 1.5, 1.5)
    }

    ctx.globalAlpha = 0.6
    ctx.beginPath()
    for (const p of [...scene.flakes, ...scene.hail]) {
      ctx.moveTo(p.x + p.r, p.y)
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    }
    ctx.fill()

    ctx.globalAlpha = 0.3
    ctx.beginPath()
    for (const gust of scene.gusts) {
      const tail = gust.x - Math.sign(scene.wind || 1) * gust.len
      const sway = Math.sin(scene.time * 3 + gust.phase) * 4
      ctx.moveTo(gust.x, gust.y)
      ctx.quadraticCurveTo((gust.x + tail) / 2, gust.y + sway, tail, gust.y)
    }
    ctx.stroke()

    if (scene.bolt) {
      ctx.globalAlpha = 0.8 * scene.bolt.life / BOLT_LIFE
      ctx.lineWidth = 2
      ctx.beginPath()
      scene.bolt.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
      ctx.stroke()
    }
    if (scene.flash) {
      ctx.globalAlpha = 0.18 * scene.flash
      ctx.fillRect(0, 0, scene.width, scene.height)
    }
  }

  // Rays come out of the sun in the header's weather icon; without a header icon the sun peeks in from the top right corner.
  private drawSun(ctx: CanvasRenderingContext2D, scene: Scene): void {
    const [r, g, b] = SUN_COLOR
    const icon = this.parentElement?.querySelector('clock-weather-card-header > clock-weather-card-icon img')
    const iconBox = icon?.getBoundingClientRect()
    let cx = scene.width - 10
    let cy = -10
    let core = 0
    let glowRadius = Math.max(scene.height * 0.7, 120)
    if (iconBox?.width && this.effects.sun) {
      // Read every frame: the icon moves when the text beside it changes width.
      const box = this.getBoundingClientRect()
      const unit = iconBox.width / 128
      cx = iconBox.left - box.left + this.effects.sun[0] * unit
      cy = iconBox.top - box.top + this.effects.sun[1] * unit
      core = 24 * unit
      glowRadius = 60 * unit
    }
    // Long enough to reach the farthest corner, so the rays cover the whole card however tall it is.
    const rayLength = Math.max(...[[0, 0], [scene.width, 0], [0, scene.height], [scene.width, scene.height]].map(([x, y]) => Math.hypot(x - cx, y - cy)))

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius)
    glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`)
    glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.globalAlpha = 1
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, scene.width, scene.height)

    // Each ray widens from the sun's rim and fades out with distance, instead of ending in a hard-edged wedge.
    const rays = ctx.createRadialGradient(cx, cy, core, cx, cy, rayLength)
    rays.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.08)`)
    rays.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.05)`)
    rays.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.fillStyle = rays
    ctx.beginPath()
    for (let i = 0; i < SUN_RAYS; i++) {
      const angle = scene.sunAngle + i * Math.PI * 2 / SUN_RAYS
      const point = (distance: number, spread: number): [number, number] => [cx + Math.cos(angle + spread) * distance, cy + Math.sin(angle + spread) * distance]
      ctx.moveTo(...point(core, -0.04))
      ctx.lineTo(...point(rayLength, -0.09))
      ctx.lineTo(...point(rayLength, 0.09))
      ctx.lineTo(...point(core, 0.04))
    }
    ctx.fill()
    ctx.fillStyle = this.color
  }
}
