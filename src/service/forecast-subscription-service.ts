import type { HomeAssistant } from 'custom-card-helpers'
import { DateTime } from 'luxon'

import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import type { ForecastType, WeatherForecast } from '@/types'

// Receives null when subscribing failed.
type Listener = (forecasts: WeatherForecast[] | null) => void

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
      logger.debug(`Unsubscribing from ${forecastType} forecast`, entityId)
      void entry.unsubscribe.then(async unsubscribe => {
        try {
          await unsubscribe?.()
        } catch (e: unknown) {
          logger.debug(`Error unsubscribing from ${forecastType} forecast, connection may already be closed`, entityId, e)
        }
      })
    }
  }

  // Kept separate from subscribe() so the long-lived HA callback doesn't capture the first listener.
  private open(hass: HomeAssistant, entries: Map<string, Entry>, key: string, entityId: string, forecastType: ForecastType): Entry {
    const entry: Entry = { listeners: new Set(), latest: null, unsubscribe: Promise.resolve(null) }
    entry.unsubscribe = hassService
      .subscribeForecast(hass, entityId, forecastType, event => {
        if (!event.forecast) logger.warn(`Received ${forecastType} forecast event without forecast entries`, entityId)
        const latest = (event.forecast ?? []).filter(forecast => {
          if (DateTime.fromISO(forecast.datetime).isValid) return true
          logger.warn(`Ignoring ${forecastType} forecast entry of "${entityId}" with invalid datetime "${forecast.datetime}"`)
          return false
        })
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
        entry.listeners.forEach(l => l(null))
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
