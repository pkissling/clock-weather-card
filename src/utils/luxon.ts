import { DateTime } from 'luxon'

import type { ClockHandle, ResolvedHeaderConfig } from '@/types'

// Luxon macro tokens equivalent to DateTime.TIME_SIMPLE / DateTime.DATE_FULL.
export const DEFAULT_TIME_PATTERN = 't'
export const DEFAULT_DATE_PATTERN = 'DDD'

// Formatting two instants a few seconds apart detects second tokens without re-implementing Luxon's parser.
const SECOND_0 = DateTime.local(2000, 1, 1, 12, 0, 0)
const SECOND_30 = DateTime.local(2000, 1, 1, 12, 0, 30)

export function configNeedsSeconds(header: ResolvedHeaderConfig): boolean {
  return !header.hidden && header.rows
    .some(row => row.segments.some(seg => seg.type === 'time' && patternNeedsSeconds(seg.time_pattern)))
}

function patternNeedsSeconds(pattern: string | undefined): boolean {
  if (!pattern) return false
  return SECOND_0.toFormat(pattern) !== SECOND_30.toFormat(pattern)
}

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
