import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'

import { minuteChanged } from '@/utils/luxon'

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
