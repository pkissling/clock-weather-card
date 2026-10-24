import { describe, expect, it } from 'vitest'

import { formatNumber } from '@/utils/number'

describe('formatNumber', () => {
  it.each([
    ['comma_decimal', -0, null, '0'],
    ['comma_decimal', -0.0004, null, '0'],
    ['comma_decimal', -0.04, 1, '0.0'],
    ['comma_decimal', -0.06, 1, '-0.1'],
    ['none', -0, null, '0'],
    ['none', -0.04, 1, '0.0'],
    ['none', -0.06, 1, '-0.1'],
  ] as const)('formats %s %d with precision %o as %s', (numberFormat, value, precision, expected) => {
    expect(formatNumber(value, { locale: 'en', numberFormat }, precision))
      .toBe(expected)
  })
})
