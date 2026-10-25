import { describe, expect, it } from 'vitest'

import { mergeTwiceDaily } from '@/utils/twice-daily'

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
