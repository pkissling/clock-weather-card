// @vitest-environment jsdom
import { DateTime } from 'luxon'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock all Lit and HA dependencies so the component can be imported in jsdom
vi.mock('lit', () => {
  class FakeLitElement {
    requestUpdate (): void {}
    connectedCallback (): void {}
    disconnectedCallback (): void {}
  }
  return {
    LitElement: FakeLitElement,
    html: (strings: TemplateStringsArray, ..._values: unknown[]): string => strings.join(''),
    css: (strings: TemplateStringsArray, ..._values: unknown[]): string => strings.join(''),
  }
})

vi.mock('lit/decorators.js', () => ({
  customElement: () => (target: unknown): unknown => target,
  property: () => (_target: unknown, _key: string): void => {},
  state: () => (_target: unknown, _key: string): void => {},
}))

vi.mock('custom-card-helpers', () => ({
  hasConfigOrEntityChanged: (): boolean => true,
  hasAction: (): boolean => false,
  handleAction: (): void => {},
  TimeFormat: { am_pm: 'am_pm', twenty_four: '24' },
}))

vi.mock('@/styles', () => ({ default: '' }))
vi.mock('@/service/logger', () => ({ default: { debug: (): void => {}, error: (): void => {} } }))
vi.mock('@/service/translations-service', () => ({ default: { t: (l: string, k: string): string => `${l}:${k}` } }))
vi.mock('@/components/clock-weather-card-today', () => ({}))
vi.mock('@/utils/development', () => ({ isDev: false }))

type CardInstance = Record<string, unknown>

describe('ClockWeatherCard timer behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  async function createCard (config: Record<string, unknown> = {}, hassTimeZone = 'UTC'): Promise<CardInstance & {
    setConfig: (cfg: Record<string, unknown>) => void
    willUpdate: (changed: Map<string, unknown>) => void
    disconnectedCallback: () => void
  }> {
    const mod = await import('@/clock-weather-card')
    const CardClass = mod.ClockWeatherCard

    const card = Object.create(CardClass.prototype)
    card.currentDate = DateTime.now()
    card.forecastSubscription = null
    card._clock = null

    card.hass = {
      config: { time_zone: hassTimeZone, unit_system: { temperature: '°C' } },
      locale: { language: 'en-GB', time_format: '24' },
      states: {},
      connection: { subscribeMessage: async (): Promise<() => Promise<void>> => async (): Promise<void> => {} },
    }

    card.setConfig({
      type: 'custom:clock-weather-card',
      entity: 'weather.home',
      ...config,
    })
    // Lit fires willUpdate after setConfig + property assignment; simulate it
    // so the clock starts (the prototype harness skips the real lifecycle).
    card.willUpdate(new Map([['config', undefined]]))

    return card
  }

  describe('timezone on currentDate', () => {
    it('uses configured time_zone', async () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
      const card = await createCard({ time_zone: 'America/New_York' })
      const dt = card.currentDate as DateTime

      expect(dt.zoneName)
        .toBe('America/New_York')
      expect(dt.hour)
        .toBe(8)
    })

    it('falls back to hass time zone when config time_zone is not set', async () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
      const card = await createCard({}, 'Asia/Tokyo')
      const dt = card.currentDate as DateTime

      expect(dt.zoneName)
        .toBe('Asia/Tokyo')
      expect(dt.hour)
        .toBe(21)
    })
  })

  describe('_startClock with seconds', () => {
    it('sets up a second-level interval when time_pattern has ss', async () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
      const card = await createCard({
        rows: [{ segments: [{ type: 'time', time_pattern: 'HH:mm:ss' }] }],
      })

      const initial = (card.currentDate as DateTime).toMillis()

      vi.advanceTimersByTime(2000)

      const updated = (card.currentDate as DateTime).toMillis()
      expect(updated)
        .toBeGreaterThan(initial)
    })
  })

  describe('_startClock without seconds', () => {
    it('sets up a minute-level interval when time_pattern has no seconds', async () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
      const card = await createCard({
        rows: [{ segments: [{ type: 'time', time_pattern: 'HH:mm' }] }],
      })

      const initial = (card.currentDate as DateTime).toMillis()

      vi.advanceTimersByTime(30_000)

      vi.advanceTimersByTime(31_000)
      const updated = (card.currentDate as DateTime).toMillis()
      expect(updated)
        .toBeGreaterThan(initial)
    })

    it('defaults to minute interval with default rows', async () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
      const card = await createCard({})

      expect(card._clock).not.toBeNull()
    })
  })

  describe('_stopClock on disconnect', () => {
    it('clears timers when disconnected', async () => {
      const card = await createCard({
        rows: [{ segments: [{ type: 'time', time_pattern: 'HH:mm:ss' }] }],
      })

      expect(card._clock).not.toBeNull()

      card.disconnectedCallback()

      expect(card._clock)
        .toBeNull()
    })
  })

  describe('config change restarts clock', () => {
    it('switches interval when config changes', async () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
      const card = await createCard({
        rows: [{ segments: [{ type: 'time', time_pattern: 'HH:mm:ss' }] }],
      })

      vi.advanceTimersByTime(1000)

      card.setConfig({
        type: 'custom:clock-weather-card',
        entity: 'weather.home',
        rows: [{ segments: [{ type: 'time', time_pattern: 'HH:mm' }] }],
      })
      card.willUpdate(new Map([['config', undefined]]))

      expect(card._clock).not.toBeNull()
    })
  })
})
