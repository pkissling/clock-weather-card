import type { HomeAssistant } from 'custom-card-helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import forecastSubscriptionService from '@/service/forecast-subscription-service'
import type { WeatherForecast, WeatherForecastEvent } from '@/types'

vi.mock('@/service/logger', () => ({ default: { debug: (): void => {}, warn: (): void => {}, error: (): void => {} } }))

interface FakeSubscription {
  message: { forecast_type: string, entity_id: string }
  emit: (forecast: WeatherForecast[]) => void
  unsubscribe: ReturnType<typeof vi.fn>
  resolve: () => void
  reject: (e: unknown) => void
}

const forecast = (temperature: number): WeatherForecast[] =>
  [{ datetime: '2026-10-03T12:00:00Z', temperature, condition: 'sunny' }]

const flush = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('forecastSubscriptionService', () => {
  let subscriptions: FakeSubscription[]
  let hass: HomeAssistant

  beforeEach(() => {
    subscriptions = []
    hass = {
      connection: {
        subscribeMessage: (callback: (event: WeatherForecastEvent) => void, message: FakeSubscription['message']) =>
          new Promise((resolve, reject) => {
            const unsubscribe = vi.fn(async () => {})
            subscriptions.push({
              message,
              emit: f => callback({ type: 'hourly', forecast: f }),
              unsubscribe,
              resolve: () => resolve(unsubscribe),
              reject,
            })
          }),
      },
    } as unknown as HomeAssistant
  })

  it('shares one subscription for the same entity and forecast type', async () => {
    const a = vi.fn()
    const b = vi.fn()
    forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', a)
    forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', b)
    subscriptions[0].resolve()
    await flush()

    subscriptions[0].emit(forecast(20))

    expect(subscriptions)
      .toHaveLength(1)
    expect(a)
      .toHaveBeenCalledWith(forecast(20))
    expect(b)
      .toHaveBeenCalledWith(forecast(20))
  })

  it('subscribes separately for a different forecast type or entity', () => {
    forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', vi.fn())
    forecastSubscriptionService.subscribe(hass, 'weather.home', 'daily', vi.fn())
    forecastSubscriptionService.subscribe(hass, 'weather.other', 'hourly', vi.fn())

    expect(subscriptions.map(s => s.message))
      .toEqual([
        expect.objectContaining({ entity_id: 'weather.home', forecast_type: 'hourly' }),
        expect.objectContaining({ entity_id: 'weather.home', forecast_type: 'daily' }),
        expect.objectContaining({ entity_id: 'weather.other', forecast_type: 'hourly' }),
      ])
  })

  it('replays the latest forecast to a late subscriber', async () => {
    forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', vi.fn())
    subscriptions[0].resolve()
    await flush()
    subscriptions[0].emit(forecast(21))

    const late = vi.fn()
    forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', late)

    expect(late)
      .toHaveBeenCalledWith(forecast(21))
  })

  it('closes the subscription only after the last listener leaves', async () => {
    const disposeA = forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', vi.fn())
    const disposeB = forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', vi.fn())
    subscriptions[0].resolve()
    await flush()

    disposeA()
    await flush()
    expect(subscriptions[0].unsubscribe).not.toHaveBeenCalled()

    disposeB()
    await flush()
    expect(subscriptions[0].unsubscribe)
      .toHaveBeenCalledTimes(1)

    forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', vi.fn())
    expect(subscriptions)
      .toHaveLength(2)
  })

  it('closes a subscription that resolves after its last listener left', async () => {
    const dispose = forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', vi.fn())
    dispose()
    subscriptions[0].resolve()
    await flush()

    expect(subscriptions[0].unsubscribe)
      .toHaveBeenCalledTimes(1)
  })

  it('notifies listeners with null and retries after a failed subscribe', async () => {
    const listener = vi.fn()
    forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', listener)
    subscriptions[0].reject(new Error('boom'))
    await flush()

    expect(listener)
      .toHaveBeenCalledWith(null)

    forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', vi.fn())

    expect(subscriptions)
      .toHaveLength(2)
  })

  it('drops forecast entries with an invalid datetime', async () => {
    const listener = vi.fn()
    forecastSubscriptionService.subscribe(hass, 'weather.home', 'hourly', listener)
    subscriptions[0].resolve()
    await flush()

    subscriptions[0].emit([{ datetime: 'garbage', temperature: 1, condition: 'sunny' }, ...forecast(20)])

    expect(listener)
      .toHaveBeenCalledWith(forecast(20))
  })
})
