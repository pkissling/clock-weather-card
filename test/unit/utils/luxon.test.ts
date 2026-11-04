import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'

import { dateTimeUtcOffset, minuteChanged } from '@/utils/luxon'

describe('minuteChanged', () => {
  const at = (iso: string): DateTime => DateTime.fromISO(iso, { zone: 'Europe/Berlin' })

  it('ignores a change within the same minute', () => {
    expect(minuteChanged(at('2025-06-15T12:00:59'), at('2025-06-15T12:00:00')))
      .toBe(false)
  })

  it('detects the next minute', () => {
    expect(minuteChanged(at('2025-06-15T12:01:00'), at('2025-06-15T12:00:59')))
      .toBe(true)
  })

  it('detects the same minute of another hour', () => {
    expect(minuteChanged(at('2025-06-15T13:00:00'), at('2025-06-15T12:00:00')))
      .toBe(true)
  })

  it('treats a missing value as changed', () => {
    expect(minuteChanged(at('2025-06-15T12:00:00'), undefined))
      .toBe(true)
  })
})

describe('dateTimeUtcOffset', () => {
  const ms = (iso: string): number => Date.parse(iso)

  it('returns the offset from the device time to the flip, parsed as UTC', () => {
    expect(dateTimeUtcOffset('2025-09-14, 10:45', ms('2025-09-14T10:44:58.500Z')))
      .toBe(1500)
  })

  it('returns a negative offset when the device clock is ahead', () => {
    expect(dateTimeUtcOffset('2025-09-14, 10:45', ms('2025-09-14T10:47:00Z')))
      .toBe(-120_000)
  })

  it('uses the date of the state across midnight', () => {
    expect(dateTimeUtcOffset('2025-09-14, 23:59', ms('2025-09-15T00:00:30Z')))
      .toBe(-90_000)
  })

  it.each(['unavailable', 'unknown', '', '10:15', '2025-09-14 10:15', '2025-09-14, 10:60', '2025-13-01, 10:15'])('rejects the state "%s"', state => {
    expect(dateTimeUtcOffset(state, ms('2025-09-14T10:00:00Z')))
      .toBeNull()
  })

  it('rejects a missing state', () => {
    expect(dateTimeUtcOffset(undefined, 0))
      .toBeNull()
  })
})
