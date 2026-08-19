import { describe, expect, it } from 'vitest'

import { gradientStopsForRange, interpolateColor, normalizeGradient, toCelsius } from '@/utils/gradient'

describe('normalizeGradient', () => {
  it('sorts stops by temperature ascending', () => {
    const stops = normalizeGradient({ 20: '#ff0000', '-10': '#0000ff', 0: '#00ff00' })
    expect(stops.map(s => s.temp))
      .toEqual([-10, 0, 20])
  })

  it('drops non-numeric keys', () => {
    const stops = normalizeGradient({ 10: '#fff', foo: '#000' })
    expect(stops.map(s => s.temp))
      .toEqual([10])
  })

  it('accepts negative and fractional temperatures', () => {
    const stops = normalizeGradient({ '-5.5': '#abc', '12.7': '#def' })
    expect(stops.map(s => s.temp))
      .toEqual([-5.5, 12.7])
  })
})

describe('interpolateColor', () => {
  const stops = normalizeGradient({ 0: '#000000', 10: '#ffffff' })

  it('clamps to the lowest color below the range', () => {
    expect(interpolateColor(stops, -5))
      .toBe('#000000')
  })

  it('clamps to the highest color above the range', () => {
    expect(interpolateColor(stops, 50))
      .toBe('#ffffff')
  })

  it('returns the exact color when the temp matches a stop', () => {
    expect(interpolateColor(stops, 0))
      .toBe('#000000')
    expect(interpolateColor(stops, 10))
      .toBe('#ffffff')
  })

  it('linearly interpolates RGB channels between stops', () => {
    // 5°C is exactly halfway between black and white → #808080
    expect(interpolateColor(stops, 5))
      .toBe('#808080')
  })

  it('parses 3-digit hex (#RGB) and interpolates correctly', () => {
    const short = normalizeGradient({ 0: '#000', 10: '#fff' })
    expect(interpolateColor(short, 5))
      .toBe('#808080')
  })

  it('parses rgb() colors', () => {
    const rgb = normalizeGradient({ 0: 'rgb(0, 0, 0)', 10: 'rgb(200, 100, 50)' })
    expect(interpolateColor(rgb, 5))
      .toBe('#643219')
  })

  it('falls back to the lower stop when a color is not parseable', () => {
    const unparsed = normalizeGradient({ 0: 'currentColor', 10: '#ffffff' })
    expect(interpolateColor(unparsed, 5))
      .toBe('currentColor')
  })

  it('returns the single stop color when only one is configured', () => {
    const single = normalizeGradient({ 15: '#abcdef' })
    expect(interpolateColor(single, -100))
      .toBe('#abcdef')
    expect(interpolateColor(single, 100))
      .toBe('#abcdef')
  })

  it('returns a neutral fallback when no stops are configured', () => {
    expect(interpolateColor([], 10))
      .toBe('#888888')
  })
})

describe('gradientStopsForRange', () => {
  const stops = normalizeGradient({ 0: '#000000', 10: '#ffffff' })

  it('emits a 0% and 100% stop at minimum', () => {
    const result = gradientStopsForRange(stops, 2, 8)
    expect(result[0].percent)
      .toBe(0)
    expect(result[result.length - 1].percent)
      .toBe(100)
  })

  it('includes interior configured stops as their relative percent on the bar', () => {
    const wider = normalizeGradient({ 0: '#000000', 10: '#888888', 20: '#ffffff' })
    const result = gradientStopsForRange(wider, 0, 20)
    expect(result)
      .toHaveLength(3)
    expect(result[1].percent)
      .toBe(50)
    expect(result[1].color)
      .toBe('#888888')
  })

  it('excludes stops at or outside the bar endpoints', () => {
    const wider = normalizeGradient({ 0: '#000000', 5: '#444444', 10: '#888888', 15: '#cccccc', 20: '#ffffff' })
    // Bar from 5°C to 15°C: interior stops are 10 (at 50%). 5 and 15 are the endpoints (exact match → emitted as 0% / 100%).
    const result = gradientStopsForRange(wider, 5, 15)
    expect(result.map(s => s.percent))
      .toEqual([0, 50, 100])
    expect(result[0].color)
      .toBe('#444444')
    expect(result[2].color)
      .toBe('#cccccc')
  })

  it('handles a zero-width range by emitting a single color at both ends', () => {
    const result = gradientStopsForRange(stops, 5, 5)
    expect(result)
      .toHaveLength(2)
    expect(result[0].color)
      .toBe(result[1].color)
  })

  it('handles inverted ranges by collapsing to a single color', () => {
    const result = gradientStopsForRange(stops, 8, 2)
    expect(result)
      .toHaveLength(2)
    expect(result[0].color)
      .toBe(result[1].color)
  })

  it('returns a neutral two-stop fallback when no stops are configured', () => {
    const result = gradientStopsForRange([], 0, 10)
    expect(result)
      .toEqual([
        { percent: 0, color: '#888888' },
        { percent: 100, color: '#888888' },
      ])
  })
})

describe('toCelsius', () => {
  it('passes Celsius values through unchanged', () => {
    expect(toCelsius(10, '°C'))
      .toBe(10)
    expect(toCelsius(0, '°C'))
      .toBe(0)
  })

  it('converts Fahrenheit to Celsius', () => {
    expect(toCelsius(32, '°F'))
      .toBe(0)
    expect(toCelsius(212, '°F'))
      .toBeCloseTo(100, 6)
    expect(toCelsius(50, '°F'))
      .toBeCloseTo(10, 6)
  })

  it('treats unknown units as Celsius', () => {
    expect(toCelsius(20, null))
      .toBe(20)
    expect(toCelsius(20, 'K'))
      .toBe(20)
  })
})
