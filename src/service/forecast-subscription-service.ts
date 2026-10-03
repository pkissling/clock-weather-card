import type { HomeAssistant } from 'custom-card-helpers'

import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import type { ForecastType, WeatherForecast } from '@/types'

type Listener = (forecasts: WeatherForecast[]) => void

interface Entry {
  listeners: Set<Listener>
  latest: WeatherForecast[] | null
  unsubscribe: Promise<(() => Promise<void>) | null>
}

class ForecastSubscriptionService {
  private readonly registries = new WeakMap<object, Map<string, Entry>>()

  public subscribe(hass: HomeAssistant, entityId: string, forecastType: ForecastType, listener: Listener): () => void {
    const entries = this.entriesFor(hass)
    const key = `${entityId}|${forecastType}`
    const entry = entries.get(key) ?? this.open(hass, entries, key, entityId, forecastType)
    if (entry.latest) listener(entry.latest)
    entry.listeners.add(listener)

    return () => {
      if (!entry.listeners.delete(listener) || entry.listeners.size > 0) return
      if (entries.get(key) === entry) entries.delete(key)
      void entry.unsubscribe.then(async unsubscribe => {
        try {
          await unsubscribe?.()
        } catch (_: unknown) {
          // swallow — connection may already be closed
        }
      })
    }
  }

  // Kept separate from subscribe() so the long-lived HA callback doesn't capture the first listener.
  private open(hass: HomeAssistant, entries: Map<string, Entry>, key: string, entityId: string, forecastType: ForecastType): Entry {
    const entry: Entry = { listeners: new Set(), latest: null, unsubscribe: Promise.resolve(null) }
    entry.unsubscribe = hassService
      .subscribeForecast(hass, entityId, forecastType, event => {
        const latest = event.forecast ?? []
        entry.latest = latest
        entry.listeners.forEach(l => l(latest))
      })
      .then(unsubscribe => {
        logger.debug(`Subscribed to ${forecastType} forecast`, entityId)
        return unsubscribe
      })
      .catch((e: unknown) => {
        logger.error(`Error subscribing to ${forecastType} forecast`, e)
        if (entries.get(key) === entry) entries.delete(key)
        entry.listeners.forEach(l => l([]))
        return null
      })
    entries.set(key, entry)
    return entry
  }

  private entriesFor(hass: HomeAssistant): Map<string, Entry> {
    let entries = this.registries.get(hass.connection)
    if (!entries) {
      entries = new Map()
      this.registries.set(hass.connection, entries)
    }
    return entries
  }
}

export default new ForecastSubscriptionService()
