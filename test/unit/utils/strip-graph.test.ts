import { describe, expect, it } from 'vitest'

import { stripGraphPaths } from '@/utils/strip-graph'

// [x0, y0, x1, y1, ...] of "M x,y C x,y x,y x,y C x,y x,y x,y"
const numbers = (path: string): number[] => path.match(/-?[\d.]+/g)!.map(Number)
// y at the left edge, centre and right edge
const anchors = (path: string): number[] => [1, 7, 13].map(i => numbers(path)[i])
const columns = (values: (number | null)[]): string[] => stripGraphPaths(values)!.paths

describe('stripGraphPaths', () => {
  it('returns null without any temperature', () => {
    expect(stripGraphPaths([]))
      .toBeNull()
    expect(stripGraphPaths([null, null]))
      .toBeNull()
  })

  it('scales the range to y 90 (min) - 10 (max) and joins edges at the mean of neighbours', () => {
    const graph = stripGraphPaths([10, 20, 30])!
    expect([graph.min, graph.max])
      .toEqual([10, 30])
    expect(graph.paths.map(anchors))
      .toEqual([[90, 90, 70], [70, 50, 30], [30, 10, 10]])
  })

  it('shares the slope where adjacent columns meet, so the curve has no kink', () => {
    const paths = columns([12, 18, 15, 21])
    for (let i = 0; i < paths.length - 1; i++) {
      const [,,,,,,,,,, x, y, xEnd, yEnd] = numbers(paths[i])
      const [xStart, yStart, x2, y2] = numbers(paths[i + 1])
      expect((yEnd - y) / (xEnd - x))
        .toBeCloseTo((y2 - yStart) / (x2 - xStart), 1)
    }
  })

  it('draws a flat line through the middle when all temperatures are equal', () => {
    expect(columns([5, 5]))
      .toEqual(['M0,50 C16.67,50 33.33,50 50,50 C66.67,50 83.33,50 100,50', 'M0,50 C16.67,50 33.33,50 50,50 C66.67,50 83.33,50 100,50'])
  })

  it('bridges gaps with the mean of the nearest known neighbours', () => {
    expect(columns([10, null, null, 30])
      .map(p => anchors(p)[1]))
      .toEqual([90, 50, 50, 10])
  })

  it('extends the nearest known temperature into leading and trailing gaps', () => {
    expect(columns([null, 10, 30, null])
      .map(anchors))
      .toEqual([[90, 90, 90], [90, 90, 50], [50, 10, 10], [10, 10, 10]])
  })
})
