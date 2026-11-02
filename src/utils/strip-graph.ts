// The line spans y 10-90 of the 100-unit viewBox, so the stroke at the extremes isn't clipped.
export const GRAPH_TOP = 10
export const GRAPH_BOTTOM = 90

export interface StripGraphPaths {
  min: number
  max: number
  // Per column: an SVG path from the left edge (x 0) over the centre (x 50) to the right edge (x 100).
  paths: string[]
}

const round = (n: number): number => Math.round(n * 100) / 100

// Each column draws its own segment of a Catmull-Rom curve: the edges sit at the mean with the neighbour and share
// its slope, so adjacent segments join into one smooth line without measuring the layout.
// Gaps (sun events, missing temperatures) take the mean of their nearest known neighbours, bridging them.
export function stripGraphPaths(values: (number | null)[]): StripGraphPaths | null {
  const known = values.filter((v): v is number => v !== null)
  if (known.length === 0) return null
  const min = Math.min(...known)
  const max = Math.max(...known)
  const ys = values.map((v, i) => {
    if (v === null) {
      const prev = values.slice(0, i)
        .reverse()
        .find((x): x is number => x !== null)
      const next = values.slice(i + 1)
        .find((x): x is number => x !== null)
      v = prev === undefined ? next! : next === undefined ? prev : (prev + next) / 2
    }
    return max === min ? 50 : GRAPH_BOTTOM - (v - min) / (max - min) * (GRAPH_BOTTOM - GRAPH_TOP)
  })
  const paths = ys.map((cur, i) => {
    const prev = ys[i - 1] ?? cur
    const next = ys[i + 1] ?? cur
    const left = (prev + cur) / 2
    const right = (cur + next) / 2
    // Slopes per x unit; a third of the 50-unit half gives the Bézier control offset.
    const h = 50 / 3
    const [mLeft, mCenter, mRight] = [(cur - prev) / 100, (next - prev) / 200, (next - cur) / 100]
    const p = (x: number, y: number): string => `${round(x)},${round(y)}`
    return `M${p(0, left)} C${p(h, left + mLeft * h)} ${p(50 - h, cur - mCenter * h)} ${p(50, cur)}`
      + ` C${p(50 + h, cur + mCenter * h)} ${p(100 - h, right - mRight * h)} ${p(100, right)}`
  })
  return { min, max, paths }
}
