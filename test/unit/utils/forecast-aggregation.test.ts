import { describe, expect, it } from 'vitest'

import { mergeHourly, mergeTwiceDaily } from '@/utils/forecast-aggregation'

describe('mergeTwiceDaily', () => {
  it('merges a day and its night into one entry at the start of the provider-local day', () => {
    expect(mergeTwiceDaily([
      { datetime: '2025-09-14T06:00:00-04:00', is_daytime: true, condition: 'sunny', temperature: 20, precipitation_probability: 10 },
      { datetime: '2025-09-14T18:00:00-04:00', is_daytime: false, condition: 'rainy', temperature: 10, precipitation_probability: 60 },
    ]))
      .toEqual([
        { datetime: '2025-09-14T00:00:00.000-04:00', condition: 'sunny', temperature: 20, templow: 10, precipitation_probability: 60 },
      ])
  })

  it('keeps a leading night-only period as the day with its temperature and no low', () => {
    expect(mergeTwiceDaily([
      { datetime: '2025-09-14T18:00:00-04:00', is_daytime: false, condition: 'clear-night', temperature: 10 },
      { datetime: '2025-09-15T06:00:00-04:00', is_daytime: true, condition: 'sunny', temperature: 20 },
    ]))
      .toEqual([
        { datetime: '2025-09-14T00:00:00.000-04:00', condition: 'clear-night', temperature: 10, templow: undefined, precipitation_probability: undefined },
        { datetime: '2025-09-15T00:00:00.000-04:00', condition: 'sunny', temperature: 20, templow: undefined, precipitation_probability: undefined },
      ])
  })

  it('falls back to the night condition and keeps extra attributes, the day winning', () => {
    expect(mergeTwiceDaily([
      { datetime: '2025-09-14T06:00:00-04:00', is_daytime: true, condition: null, temperature: 20, humidity: 40 } as never,
      { datetime: '2025-09-14T18:00:00-04:00', is_daytime: false, condition: 'cloudy', temperature: 10, humidity: 80, wind_speed: 5 } as never,
    ]))
      .toEqual([
        { datetime: '2025-09-14T00:00:00.000-04:00', condition: 'cloudy', temperature: 20, templow: 10, humidity: 40, wind_speed: 5, precipitation_probability: undefined },
      ])
  })
})

describe('mergeHourly', () => {
  it('groups hours by day in the given time zone, not the provider offset', () => {
    expect(mergeHourly([
      { datetime: '2025-09-14T21:00:00+00:00', condition: 'cloudy', temperature: 12 },
      { datetime: '2025-09-14T22:00:00+00:00', condition: 'rainy', temperature: 10 },
    ], 'Europe/Berlin')
      .map(f => f.datetime))
      .toEqual(['2025-09-14T00:00:00.000+02:00', '2025-09-15T00:00:00.000+02:00'])
  })

  it('takes the high/low across the day, the most frequent condition, the highest probability and the summed precipitation', () => {
    expect(mergeHourly([
      { datetime: '2025-09-14T06:00:00+00:00', condition: 'cloudy', temperature: 9, precipitation_probability: 20, precipitation: 0.5, humidity: 90 },
      { datetime: '2025-09-14T09:00:00+00:00', condition: 'sunny', temperature: 15, precipitation_probability: null, precipitation: 0 },
      { datetime: '2025-09-14T12:00:00+00:00', condition: 'sunny', temperature: 21, templow: 7, precipitation_probability: 40, precipitation: 1.5 },
    ] as never, 'UTC'))
      .toEqual([
        { datetime: '2025-09-14T00:00:00.000Z', condition: 'sunny', temperature: 21, templow: 7, precipitation_probability: 40, precipitation: 2, humidity: 90 },
      ])
  })

  it('prefers daytime conditions and resolves ties to the earliest condition', () => {
    expect(mergeHourly([
      { datetime: '2025-09-14T01:00:00+00:00', is_daytime: false, condition: 'clear-night', temperature: 8 },
      { datetime: '2025-09-14T02:00:00+00:00', is_daytime: false, condition: 'clear-night', temperature: 8 },
      { datetime: '2025-09-14T10:00:00+00:00', is_daytime: true, condition: 'rainy', temperature: 14 },
      { datetime: '2025-09-14T11:00:00+00:00', is_daytime: true, condition: 'cloudy', temperature: 15 },
    ] as never, 'UTC')[0].condition)
      .toBe('rainy')
  })

  it('leaves temperature, low and condition unset when no entry has them', () => {
    expect(mergeHourly([
      { datetime: '2025-09-14T10:00:00+00:00', temperature: null, condition: null },
      { datetime: '2025-09-14T11:00:00+00:00', temperature: null, condition: null },
    ], 'UTC'))
      .toEqual([
        { datetime: '2025-09-14T00:00:00.000Z', temperature: null, templow: undefined, condition: null, precipitation_probability: undefined },
      ])
  })

  it('returns no days for no entries', () => {
    expect(mergeHourly([], 'UTC'))
      .toEqual([])
  })
})
