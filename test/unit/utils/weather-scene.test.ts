import { describe, expect, it } from 'vitest'

import {
  BOLT_LIFE, BOUNCE, createScene, type Droplet, effectsFor, GRAVITY, HAIL_BOUNCE, HAIL_BOUNCES, HAIL_TERMINAL, type Hailstone, type Scene, seededRandom, step, twinkle, windDrift,
} from '@/utils/weather-scene'

const constant = (value: number) => (): number => value
const emptyScene = (overrides: Partial<Scene> = {}): Scene => ({
  width: 400, height: 200, wind: 0, terminal: 700, random: constant(0.5),
  drops: [], droplets: [], flakes: [], hail: [], clouds: [], fog: [], stars: [], gusts: [],
  sun: false, sunAngle: 0, lightning: false, nextStrike: 10, flash: 0, bolt: null, time: 0,
  ...overrides,
})
const droplet = (overrides: Partial<Droplet> = {}): Droplet => ({ x: 100, y: 199, vx: 0, vy: 100, life: 0.6, bounced: false, ...overrides })
const hailstone = (overrides: Partial<Hailstone> = {}): Hailstone => ({ x: 100, y: 197, vx: 0, vy: HAIL_TERMINAL, r: 2, bounces: 0, ...overrides })

describe('effectsFor', () => {
  it.each(['sunny', 'clear', 'clear-night'])('shows the sun by day and stars at night for %s', state => {
    expect(effectsFor(state, false))
      .toEqual({ sun: [64, 64] })
    expect(effectsFor(state, true))
      .toEqual({ stars: 60 })
  })

  it('adds clouds to the sun or the stars when partly cloudy', () => {
    expect(effectsFor('partlycloudy', false))
      .toEqual({ sun: [39, 51], clouds: 3 })
    expect(effectsFor('partlycloudy', true))
      .toEqual({ stars: 40, clouds: 3 })
  })

  it.each([
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
  ])('maps %s the same by day and at night', (state, effects) => {
    expect(effectsFor(state, false))
      .toEqual(effects)
    expect(effectsFor(state, true))
      .toEqual(effects)
  })

  it.each([null, 'exceptional', 'unknown', 'partlycloudy-night', 'constructor'])('has no animation for %s', state => {
    expect(effectsFor(state, false))
      .toBeUndefined()
  })
})

describe('windDrift', () => {
  it.each([
    [10, 'm/s', 250],
    [36, 'km/h', 250],
    [10, 'mph', 111.76],
    [-4, 'm/s', -100],
  ])('converts %s %s to px/s', (speed, unit, expected) => {
    expect(windDrift(speed, unit))
      .toBeCloseTo(expected)
  })

  it('caps strong wind', () => {
    expect(windDrift(200, 'km/h'))
      .toBe(400)
    expect(windDrift(-200, 'km/h'))
      .toBe(-400)
  })

  it.each([
    [undefined, 'km/h'],
    [null, 'km/h'],
    ['calm', 'km/h'],
    [10, undefined],
    [10, 'Bft'],
  ])('is 0 for speed %s and unit %s', (speed, unit) => {
    expect(windDrift(speed, unit))
      .toBe(0)
  })
})

describe('seededRandom', () => {
  it('repeats the same sequence for the same seed within [0, 1)', () => {
    const values = Array.from({ length: 100 }, seededRandom(1))
    expect(values)
      .toEqual(Array.from({ length: 100 }, seededRandom(1)))
    expect(values.every(v => v >= 0 && v < 1))
      .toBe(true)
  })
})

describe('twinkle', () => {
  it('pulses a star between 0.25 and 0.85', () => {
    const star = { x: 0, y: 0, r: 1, phase: 0, speed: 1 }
    expect(twinkle(star, -Math.PI / 2))
      .toBeCloseTo(0.25)
    expect(twinkle(star, Math.PI / 2))
      .toBeCloseTo(0.85)
  })
})

describe('createScene', () => {
  it('scales particle counts with the card width', () => {
    expect(createScene({ rain: 40 }, 400, 200, 0, seededRandom(1)).drops)
      .toHaveLength(40)
    const wide = createScene({ rain: 90, stars: 60, gusts: 10, hail: 30 }, 800, 200, 0, seededRandom(1))
    expect([wide.drops.length, wide.stars.length, wide.gusts.length, wide.hail.length])
      .toEqual([180, 120, 20, 60])
  })

  it('keeps the number of clouds and fog bands on any width', () => {
    const scene = createScene({ clouds: 4, fog: 6 }, 1200, 200, 0, seededRandom(1))
    expect([scene.clouds.length, scene.fog.length])
      .toEqual([4, 6])
  })

  it('creates nothing an effect does not ask for', () => {
    const scene = createScene({}, 400, 200, 0, seededRandom(1))
    expect([scene.drops, scene.flakes, scene.hail, scene.clouds, scene.fog, scene.stars, scene.gusts].every(list => !list.length))
      .toBe(true)
    expect([scene.sun, scene.lightning])
      .toEqual([false, false])
  })

  it('spreads clouds and stars over the whole card, not just its top', () => {
    const scene = createScene({ clouds: 6, stars: 60 }, 400, 400, 0, seededRandom(1))
    expect(Math.max(...scene.clouds.map(c => c.y)))
      .toBeGreaterThan(200)
    expect(Math.max(...scene.stars.map(s => s.y)))
      .toBeGreaterThan(300)
  })

  it('spawns drops upwind so the drift covers the whole card', () => {
    const scene = createScene({ rain: 40, terminal: 700 }, 400, 700, 350, seededRandom(1))
    expect(Math.min(...scene.drops.map(d => d.x)))
      .toBeLessThan(-100)
  })
})

describe('step', () => {
  describe('rain', () => {
    it('accelerates drops up to their terminal velocity and drifts them with the wind', () => {
      const scene = emptyScene({ wind: 100, drops: [{ x: 50, y: 0, vy: 0 }] })
      step(scene, 0.1)
      expect(scene.drops[0])
        .toEqual({ x: 60, y: GRAVITY * 0.1 * 0.1, vy: GRAVITY * 0.1 })

      step(scene, 0.5)
      expect(scene.drops[0].vy)
        .toBe(700)
    })

    it('splashes a drop that reaches the bottom and recycles it above the card', () => {
      const scene = emptyScene({ drops: [{ x: 50, y: 195, vy: 700 }], random: constant(0.1) })
      step(scene, 0.01)

      expect(scene.drops[0].y)
        .toBeLessThanOrEqual(0)
      expect(scene.droplets.length)
        .toBeGreaterThanOrEqual(2)
      expect(scene.droplets.every(d => Math.abs(d.x - 50) < 2 && d.vy < 0))
        .toBe(true)
    })

    it('recycles without a splash for the remaining share of drops', () => {
      const scene = emptyScene({ drops: [{ x: 50, y: 195, vy: 700 }], random: constant(0.9) })
      step(scene, 0.01)

      expect(scene.droplets)
        .toHaveLength(0)
    })

    it('bounces a droplet once off the bottom, then removes it', () => {
      const scene = emptyScene({ droplets: [droplet({ vx: 50 })] })
      step(scene, 0.01)
      const [bounced] = scene.droplets
      expect(bounced.bounced)
        .toBe(true)
      expect(bounced.vy)
        .toBeCloseTo(-(100 + GRAVITY * 0.01) * BOUNCE)
      expect(bounced.vx)
        .toBeCloseTo(50 * BOUNCE)

      scene.droplets = [droplet({ bounced: true })]
      step(scene, 0.01)
      expect(scene.droplets)
        .toHaveLength(0)
    })

    it('removes a droplet once its life runs out', () => {
      const scene = emptyScene({ droplets: [droplet({ y: 50, life: 0.005 })] })
      step(scene, 0.01)
      expect(scene.droplets)
        .toHaveLength(0)
    })
  })

  describe('hail', () => {
    it('bounces a hailstone off the bottom with a sideways kick', () => {
      const scene = emptyScene({ hail: [hailstone()], random: constant(1) })
      step(scene, 0.01)
      const [stone] = scene.hail
      expect(stone.bounces)
        .toBe(1)
      expect(stone.vy)
        .toBeCloseTo(-HAIL_TERMINAL * HAIL_BOUNCE)
      expect(stone.vx)
        .toBe(60)
      expect(stone.y)
        .toBe(198)
    })

    it('recycles a hailstone above the card after its last bounce', () => {
      const scene = emptyScene({ hail: [hailstone({ bounces: HAIL_BOUNCES, vx: 30 })] })
      step(scene, 0.01)
      expect(scene.hail[0])
        .toMatchObject({ vx: 0, vy: HAIL_TERMINAL, bounces: 0 })
      expect(scene.hail[0].y)
        .toBeLessThanOrEqual(0)
    })

    it('slows a rising hailstone down under gravity', () => {
      const scene = emptyScene({ hail: [hailstone({ y: 100, vy: -300 })] })
      step(scene, 0.1)
      expect(scene.hail[0].vy)
        .toBeCloseTo(-300 + GRAVITY * 0.1)
    })
  })

  describe('snow', () => {
    it('recycles a flake that leaves the bottom at the top', () => {
      const scene = emptyScene({ flakes: [{ x: 100, y: 202, vy: 40, r: 2, phase: 0 }] })
      step(scene, 0.01)
      expect(scene.flakes[0].y)
        .toBe(-2)
    })

    it('wraps a flake blown off one side to the other', () => {
      const scene = emptyScene({ wind: 400, flakes: [{ x: 401.9, y: 50, vy: 40, r: 2, phase: 0 }] })
      step(scene, 0.01)
      expect(scene.flakes[0].x)
        .toBeLessThan(10)

      scene.wind = -400
      scene.flakes[0].x = -1.9
      step(scene, 0.01)
      expect(scene.flakes[0].x)
        .toBeGreaterThan(390)
    })
  })

  describe('clouds and fog', () => {
    it('drift left to right without wind and wrap around', () => {
      const scene = emptyScene({ clouds: [{ x: 100, y: 20, r: 10, speed: 10 }], fog: [{ x: 0, y: 100, w: 600, h: 40, speed: 10 }] })
      step(scene, 1)
      expect([scene.clouds[0].x, scene.fog[0].x])
        .toEqual([110, 10])

      scene.clouds[0].x = 421
      step(scene, 1)
      expect(scene.clouds[0].x)
        .toBe(-13)
    })

    it('travel with the wind', () => {
      const scene = emptyScene({ wind: -100, clouds: [{ x: 100, y: 20, r: 10, speed: 10 }] })
      step(scene, 1)
      expect(scene.clouds[0].x)
        .toBe(100 - 10 - 20)
    })
  })

  describe('gusts', () => {
    it('blow across the card and come back on the near side at a new height', () => {
      const scene = emptyScene({ gusts: [{ x: 100, y: 50, len: 50, speed: 400, phase: 0 }], random: constant(0.5) })
      step(scene, 0.1)
      expect(scene.gusts[0].x)
        .toBe(140)

      scene.gusts[0].x = 449
      step(scene, 0.01)
      expect(scene.gusts[0])
        .toMatchObject({ x: -100, y: 100 })
    })

    it('blow right to left in a westward wind, faster with stronger wind', () => {
      const scene = emptyScene({ wind: -100, gusts: [{ x: 100, y: 50, len: 50, speed: 400, phase: 0 }] })
      step(scene, 0.1)
      expect(scene.gusts[0].x)
        .toBe(50)

      scene.gusts[0].x = -49
      step(scene, 0.01)
      expect(scene.gusts[0].x)
        .toBe(500)
    })
  })

  describe('sun', () => {
    it('turns the rays slowly', () => {
      const scene = emptyScene({ sun: true })
      step(scene, 10)
      expect(scene.sunAngle)
        .toBeCloseTo(0.8)
    })
  })

  describe('lightning', () => {
    it('strikes when the timer runs out: a bolt from the top, a flash and a new timer', () => {
      const scene = emptyScene({ lightning: true, nextStrike: 0.01, random: seededRandom(3) })
      step(scene, 0.02)

      expect(scene.flash)
        .toBe(1)
      expect(scene.bolt!.life)
        .toBe(BOLT_LIFE)
      const points = scene.bolt!.points
      expect(points[0][1])
        .toBe(0)
      expect(points[points.length - 1][1])
        .toBeGreaterThanOrEqual(0.55 * 200)
      expect(scene.nextStrike)
        .toBeGreaterThanOrEqual(3)
    })

    it('fades the flash and removes the bolt once its life is over', () => {
      const scene = emptyScene({ lightning: true, flash: 1, bolt: { points: [[0, 0]], life: BOLT_LIFE } })
      step(scene, 0.1)
      expect(scene.flash)
        .toBeCloseTo(0.6)
      expect(scene.bolt!.life)
        .toBeCloseTo(BOLT_LIFE - 0.1)

      step(scene, 0.3)
      expect(scene.flash)
        .toBe(0)
      expect(scene.bolt)
        .toBeNull()
    })

    it('never strikes without lightning', () => {
      const scene = emptyScene({ nextStrike: 0 })
      step(scene, 1)
      expect(scene.bolt)
        .toBeNull()
    })
  })
})
