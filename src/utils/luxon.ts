import { DateTime } from 'luxon'

import type { ClockHandle, ResolvedHeaderConfig } from '@/types'

// Luxon macro tokens equivalent to DateTime.TIME_SIMPLE / DateTime.DATE_FULL.
export const DEFAULT_TIME_PATTERN = 't'
export const DEFAULT_DATE_PATTERN = 'DDD'

// Formatting two instants a few seconds apart detects second tokens without re-implementing Luxon's parser.
const SECOND_0 = DateTime.local(2000, 1, 1, 12, 0, 0)
const SECOND_30 = DateTime.local(2000, 1, 1, 12, 0, 30)

export function configNeedsSeconds(header: ResolvedHeaderConfig): boolean {
  return !header.hide && header.rows
    .some(row => row.segments.some(seg => seg.type === 'time' && patternNeedsSeconds(seg.time_pattern)))
}

function patternNeedsSeconds(pattern: string | undefined): boolean {
  if (!pattern) return false
  return SECOND_0.toFormat(pattern) !== SECOND_30.toFormat(pattern)
}

// `now` is the clock's time source, so ticks align to its second/minute boundaries.
export function startClock(needsSeconds: boolean, onTick: () => void, now: () => number = Date.now): ClockHandle {
  const periodMs = needsSeconds ? 1000 : 60_000
  let timeoutId: number
  // Recomputes the delay on every tick, so a late tick (sleep, background throttling) realigns to the next boundary.
  const schedule = (): void => {
    timeoutId = window.setTimeout(() => {
      onTick()
      schedule()
    }, periodMs - (now() % periodMs))
  }

  onTick()
  schedule()

  return { stop: () => clearTimeout(timeoutId) }
}

export const minuteChanged = (next?: DateTime, prev?: DateTime): boolean =>
  !next || !prev || !next.hasSame(prev, 'minute')

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

// Parses the state of the Time & Date integration's sensor.date_time_utc, e.g. "2026-11-04, 10:15".
export const parseDateTimeUtc = (state: string | undefined | null): DateTime =>
  DateTime.fromFormat(state ?? '', 'yyyy-MM-dd, HH:mm', { zone: 'utc' })

// sensor.date_time_utc flips exactly at a full UTC minute, so at the flip the server time is its state at :00.
// Returns the offset to add to the device time, or null if the state doesn't parse.
export function dateTimeUtcOffset(state: string | undefined | null, deviceMs: number): number | null {
  const instant = parseDateTimeUtc(state)
  return instant.isValid ? instant.toMillis() - deviceMs : null
}
