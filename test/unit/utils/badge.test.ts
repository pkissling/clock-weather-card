import { describe, expect, it } from 'vitest'

import { bandColor, contrastTextColor, toNumber } from '@/utils/badge'

describe('bandColor', () => {
  const bands = { 0: '#00e400', 51: '#ffff00', 101: '#ff7e00' }

  it('picks the highest band the value reaches, independent of key order', () => {
    expect(bandColor({ 101: '#ff7e00', 0: '#00e400', 51: '#ffff00' }, 75))
      .toBe('#ffff00')
    expect(bandColor(bands, 51))
      .toBe('#ffff00')
    expect(bandColor(bands, 500))
      .toBe('#ff7e00')
  })

  it('returns null below the lowest band or without a value', () => {
    expect(bandColor(bands, -1))
      .toBeNull()
    expect(bandColor(bands, null))
      .toBeNull()
  })
})

describe('contrastTextColor', () => {
  it('uses black on light and white on dark backgrounds', () => {
    expect(contrastTextColor('#ffff00'))
      .toBe('#000000')
    expect(contrastTextColor('#7e0023'))
      .toBe('#ffffff')
    expect(contrastTextColor('rgb(0, 0, 0)'))
      .toBe('#ffffff')
  })

  it('returns null for colors it cannot parse', () => {
    expect(contrastTextColor('var(--red)'))
      .toBeNull()
  })
})

describe('toNumber', () => {
  it('parses finite numbers and numeric strings only', () => {
    expect(toNumber(4))
      .toBe(4)
    expect(toNumber(' 4.5 '))
      .toBe(4.5)
    expect(toNumber(NaN))
      .toBeNull()
    expect(toNumber(''))
      .toBeNull()
    expect(toNumber('on'))
      .toBeNull()
    expect(toNumber(null))
      .toBeNull()
  })
})
