import type { HomeAssistant } from 'custom-card-helpers'
import { DateTime } from 'luxon'

import configService from '@/service/config-service'
import type { ClockHandle, ClockWeatherCardConfig } from '@/types'

// Two fixed reference points that differ only in their second component.
// Used to detect whether a Luxon format pattern produces output that changes every second
// without re-implementing Luxon's token parser (handles macro tokens and quoted literals).
const SECOND_0 = DateTime.local(2000, 1, 1, 12, 0, 0)
const SECOND_30 = DateTime.local(2000, 1, 1, 12, 0, 30)

export function computeNow(hass: HomeAssistant, config: ClockWeatherCardConfig): DateTime {
  return DateTime.now()
    .setLocale(configService.getLocale(config, hass))
    .setZone(configService.getTimeZone(config, hass))
}

export function configNeedsSeconds(config: ClockWeatherCardConfig): boolean {
  return configService.getRows(config)
    .some(row => row.segments.some(seg => seg.type === 'time' && patternNeedsSeconds(seg.time_pattern)))
}

export function patternNeedsSeconds(pattern: string | undefined): boolean {
  if (!pattern) return false
  return SECOND_0.toFormat(pattern) !== SECOND_30.toFormat(pattern)
}

// Schedules `onTick` aligned to the next second/minute boundary, then on every
// second or minute thereafter. Returns a handle whose `stop()` cancels both
// the initial timeout and the recurring interval.
export function startClock(needsSeconds: boolean, onTick: () => void): ClockHandle {
  const periodMs = needsSeconds ? 1000 : 60_000
  const delayMs = periodMs - (Date.now() % periodMs)
  let intervalId: number | null = null

  onTick()
  const timeoutId = window.setTimeout(() => {
    onTick()
    intervalId = window.setInterval(onTick, periodMs)
  }, delayMs)

  return {
    stop: () => {
      clearTimeout(timeoutId)
      if (intervalId !== null) clearInterval(intervalId)
    }
  }
}

export const isValidTimeZone = (timeZone: string): boolean =>
  DateTime.now()
    .setZone(timeZone).isValid

export const isValidLocale = (locale: string): boolean => {
  try {
    DateTime.now()
      .setLocale(locale)
      .toFormat('cccc')
    return true
  } catch {
    return false
  }
}
