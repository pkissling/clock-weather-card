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

export function startClock(needsSeconds: boolean, onTick: () => void): ClockHandle {
  const periodMs = needsSeconds ? 1000 : 60_000
  let timeoutId: number
  // Recomputes the delay on every tick, so a late tick (sleep, background throttling) realigns to the next boundary.
  const schedule = (): void => {
    timeoutId = window.setTimeout(() => {
      onTick()
      schedule()
    }, periodMs - (Date.now() % periodMs))
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
