// Particle physics for weather_animation. Idea from ha-ani-weather-card (MIT, alexsto1an), written from scratch.
// Units are CSS pixels and seconds; particle counts are per 400px of card width.

export type Effects = {
  rain?: number
  // Terminal velocity of the rain in px/s.
  terminal?: number
  snow?: number
  hail?: number
  clouds?: number
  fog?: number
  stars?: number
  // Where the sun sits in the header's weather icon, in the icon's 128-unit grid (the same for every icon style).
  sun?: [number, number]
  lightning?: boolean
  gusts?: number
}

const CLEAR_DAY: Effects = { sun: [64, 64] }
const CLEAR_NIGHT: Effects = { stars: 60 }
const PARTLY_CLOUDY_DAY: Effects = { sun: [39, 51], clouds: 3 }
const PARTLY_CLOUDY_NIGHT: Effects = { stars: 40, clouds: 3 }
const EFFECTS = new Map<string, Effects>([
  ['cloudy', { clouds: 6 }],
  ['fog', { fog: 6 }],
  ['hail', { hail: 30, clouds: 4 }],
  ['lightning', { lightning: true, clouds: 5 }],
  ['lightning-rainy', { rain: 55, terminal: 800, lightning: true, clouds: 4 }],
  ['pouring', { rain: 90, terminal: 950 }],
  ['rainy', { rain: 40, terminal: 700 }],
  ['snowy', { snow: 60 }],
  ['snowy-rainy', { rain: 20, terminal: 650, snow: 35 }],
  ['windy', { gusts: 10 }],
  ['windy-variant', { gusts: 10, clouds: 4 }],
  ['windy-exceptional', { gusts: 22 }],
])

// Follows the weather icon: clear and partly cloudy skies show the sun by day and stars at night.
export function effectsFor(state: string | null, isNight: boolean): Effects | undefined {
  if (state === 'sunny' || state === 'clear' || state === 'clear-night') return isNight ? CLEAR_NIGHT : CLEAR_DAY
  if (state === 'partlycloudy') return isNight ? PARTLY_CLOUDY_NIGHT : PARTLY_CLOUDY_DAY
  return state ? EFFECTS.get(state) : undefined
}

export const GRAVITY = 1800
export const DROP_LENGTH = 18
export const SPLASH_SHARE = 0.6
export const BOUNCE = 0.35
export const DROPLET_LIFE = 0.6
export const HAIL_TERMINAL = 850
export const HAIL_BOUNCE = 0.45
export const HAIL_BOUNCES = 2
export const BOLT_LIFE = 0.3
const FLASH_DECAY = 4
const STRIKE_INTERVAL: [number, number] = [3, 8]
const SNOW_SPEED: [number, number] = [25, 55]
const SNOW_SWAY = 12
const SUN_SPIN = 0.08
// Drift per m/s of wind, capped so drops stay recognizably falling.
const WIND_PX_PER_MS = 25
const MAX_WIND = 400

export type Drop = { x: number, y: number, vy: number }
export type Droplet = { x: number, y: number, vx: number, vy: number, life: number, bounced: boolean }
export type Flake = { x: number, y: number, vy: number, r: number, phase: number }
export type Hailstone = { x: number, y: number, vx: number, vy: number, r: number, bounces: number }
// A cloud is drawn as puffs around (x, y) that span about 2.2 r to each side.
export type Cloud = { x: number, y: number, r: number, speed: number }
export type FogBand = { x: number, y: number, w: number, h: number, speed: number }
export type Star = { x: number, y: number, r: number, phase: number, speed: number }
export type Gust = { x: number, y: number, len: number, speed: number, phase: number }
export type Bolt = { points: [number, number][], life: number }

export type Scene = {
  width: number
  height: number
  wind: number
  terminal: number
  drops: Drop[]
  droplets: Droplet[]
  flakes: Flake[]
  hail: Hailstone[]
  clouds: Cloud[]
  fog: FogBand[]
  stars: Star[]
  gusts: Gust[]
  sun: boolean
  sunAngle: number
  lightning: boolean
  nextStrike: number
  flash: number
  bolt: Bolt | null
  time: number
  random: () => number
}

const WIND_TO_MS: Record<string, number> = { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, kn: 0.514444, 'ft/s': 0.3048 }

// Horizontal drift in px/s from the weather entity's wind; 0 when the speed or unit is unknown.
export function windDrift(speed: unknown, unit: unknown): number {
  const factor = typeof unit === 'string' ? WIND_TO_MS[unit] : undefined
  const value = Number(speed)
  if (factor === undefined || speed == null || !Number.isFinite(value)) return 0
  return Math.max(-MAX_WIND, Math.min(MAX_WIND, value * factor * WIND_PX_PER_MS))
}

// Seeded so a scene, and every screenshot of it, is reproducible.
export function seededRandom(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Opacity of a star at a moment, between 0.25 and 0.85.
export const twinkle = (star: Star, time: number): number => 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase))

const between = (random: () => number, min: number, max: number): number => min + random() * (max - min)
const count = (perWidth: number | undefined, width: number): number => Math.round((perWidth ?? 0) * width / 400)
// Clouds, fog and gusts travel with the wind; without wind they drift left to right.
const direction = (scene: Scene): number => scene.wind < 0 ? -1 : 1

// Drops drift sideways on their way down, so they spawn across the width they will drift over.
function spawnX(scene: Scene): number {
  const drift = scene.terminal ? scene.wind * scene.height / scene.terminal : 0
  return between(scene.random, Math.min(0, -drift), scene.width + Math.max(0, -drift))
}

export function createScene(effects: Effects, width: number, height: number, wind: number, random: () => number): Scene {
  const scene: Scene = {
    width, height, wind, terminal: effects.terminal ?? 0, random,
    drops: [], droplets: [], flakes: [], hail: [], clouds: [], fog: [], stars: [], gusts: [],
    sun: effects.sun !== undefined, sunAngle: 0,
    lightning: effects.lightning ?? false, nextStrike: between(random, 0.5, 3), flash: 0, bolt: null,
    time: 0,
  }
  const times = <T>(n: number | undefined, make: () => T): T[] => Array.from({ length: count(n, width) }, make)
  scene.drops = times(effects.rain, () => ({ x: spawnX(scene), y: between(random, -height, height), vy: scene.terminal }))
  scene.flakes = times(effects.snow, () => ({
    x: between(random, 0, width), y: between(random, 0, height), vy: between(random, ...SNOW_SPEED), r: between(random, 1, 2.5), phase: between(random, 0, Math.PI * 2),
  }))
  scene.hail = times(effects.hail, () => ({ x: between(random, 0, width), y: between(random, -height, height), vx: 0, vy: HAIL_TERMINAL, r: between(random, 1.5, 2.5), bounces: 0 }))
  // Clouds and fog keep their count regardless of width, so a narrow card isn't empty and a wide one isn't overcast.
  scene.clouds = Array.from({ length: effects.clouds ?? 0 }, () => {
    const r = between(random, 16, 30)
    return { x: between(random, -r * 2.2, width + r * 2.2), y: between(random, 0.05, 0.9) * height, r, speed: between(random, 6, 14) }
  })
  scene.fog = Array.from({ length: effects.fog ?? 0 }, () => {
    const w = between(random, 1.2, 2) * width
    return { x: between(random, -w, width), y: between(random, 0.2, 1) * height, w, h: between(random, 30, 60), speed: between(random, 8, 18) }
  })
  scene.stars = times(effects.stars, () => ({
    x: between(random, 0, width), y: between(random, 0, 1) * height, r: between(random, 0.6, 1.6), phase: between(random, 0, Math.PI * 2), speed: between(random, 0.8, 2.5),
  }))
  scene.gusts = times(effects.gusts, () => ({
    x: between(random, 0, width), y: between(random, 0.1, 0.9) * height, len: between(random, 40, 110), speed: between(random, 350, 600), phase: between(random, 0, Math.PI * 2),
  }))
  return scene
}

function splash(scene: Scene, x: number): void {
  const { random } = scene
  const n = 2 + Math.floor(random() * 3)
  for (let i = 0; i < n; i++) {
    scene.droplets.push({ x, y: scene.height, vx: between(random, -90, 90) + scene.wind * 0.3, vy: -between(random, 120, 260), life: DROPLET_LIFE, bounced: false })
  }
}

function strike(scene: Scene): void {
  const { random, width, height } = scene
  const points: [number, number][] = [[between(random, 0.15, 0.85) * width, 0]]
  const end = between(random, 0.55, 0.85) * height
  while (points[points.length - 1][1] < end) {
    const [x, y] = points[points.length - 1]
    points.push([x + between(random, -18, 18), y + between(random, 10, 25)])
  }
  scene.bolt = { points, life: BOLT_LIFE }
  scene.flash = 1
  scene.nextStrike = between(random, ...STRIKE_INTERVAL)
}

// Moves x by dx and wraps it around the card, with `margin` of room beyond each edge.
const wrap = (x: number, dx: number, width: number, margin: number): number => {
  const next = x + dx
  if (next > width + margin) return next - width - 2 * margin
  if (next < -margin) return next + width + 2 * margin
  return next
}

export function step(scene: Scene, dt: number): void {
  const { width, height, random } = scene
  scene.time += dt

  for (const drop of scene.drops) {
    drop.vy = Math.min(scene.terminal, drop.vy + GRAVITY * dt)
    drop.y += drop.vy * dt
    drop.x += scene.wind * dt
    if (drop.y >= height) {
      if (random() < SPLASH_SHARE) splash(scene, drop.x)
      drop.x = spawnX(scene)
      drop.y = -between(random, 0, height * 0.3)
    }
  }

  for (const droplet of scene.droplets) {
    droplet.vy += GRAVITY * dt
    droplet.x += droplet.vx * dt
    droplet.y += droplet.vy * dt
    droplet.life -= dt
    if (droplet.y >= height && droplet.vy > 0) {
      if (droplet.bounced) droplet.life = 0
      else {
        droplet.y = height
        droplet.vy *= -BOUNCE
        droplet.vx *= BOUNCE
        droplet.bounced = true
      }
    }
  }
  scene.droplets = scene.droplets.filter(d => d.life > 0)

  for (const stone of scene.hail) {
    stone.vy = Math.min(HAIL_TERMINAL, stone.vy + GRAVITY * dt)
    stone.x += (stone.vx + scene.wind) * dt
    stone.y += stone.vy * dt
    if (stone.y + stone.r >= height && stone.vy > 0) {
      if (stone.bounces >= HAIL_BOUNCES) {
        Object.assign(stone, { x: between(random, 0, width), y: -between(random, 0, height * 0.3), vx: 0, vy: HAIL_TERMINAL, bounces: 0 })
      } else {
        stone.y = height - stone.r
        stone.vy *= -HAIL_BOUNCE
        stone.vx = between(random, -60, 60)
        stone.bounces++
      }
    }
  }

  for (const flake of scene.flakes) {
    flake.y += flake.vy * dt
    flake.x = wrap(flake.x, (scene.wind * 0.5 + Math.cos(scene.time * 1.5 + flake.phase) * SNOW_SWAY) * dt, width, flake.r)
    if (flake.y - flake.r >= height) {
      flake.y = -flake.r
      flake.x = between(random, 0, width)
    }
  }

  const dir = direction(scene)
  for (const cloud of scene.clouds) cloud.x = wrap(cloud.x, (dir * cloud.speed + scene.wind * 0.2) * dt, width, cloud.r * 2.2)
  for (const band of scene.fog) band.x = wrap(band.x, (dir * band.speed + scene.wind * 0.2) * dt, width, band.w)

  for (const gust of scene.gusts) {
    gust.x += dir * (gust.speed + Math.abs(scene.wind)) * dt
    if (dir > 0 ? gust.x - gust.len > width : gust.x + gust.len < 0) {
      gust.x = dir > 0 ? -between(random, 0, width * 0.5) : width + between(random, 0, width * 0.5)
      gust.y = between(random, 0.1, 0.9) * height
    }
  }

  if (scene.sun) scene.sunAngle += SUN_SPIN * dt

  if (scene.lightning) {
    scene.flash = Math.max(0, scene.flash - FLASH_DECAY * dt)
    if (scene.bolt) {
      scene.bolt.life -= dt
      if (scene.bolt.life <= 0) scene.bolt = null
    }
    scene.nextStrike -= dt
    if (scene.nextStrike <= 0) strike(scene)
  }
}
