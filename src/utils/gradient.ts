import type { GradientStop } from '@/types'

export const DEFAULT_GRADIENT: Record<number, string> = {
  '-10': '#78A2CC',
  '0': '#A4C3D2',
  '10': '#79D2B3',
  '20': '#FCF570',
  '30': '#FF964F',
  '40': '#FFC09F',
}

export interface ColorStop {
  temp: number
  color: string
}

export function normalizeGradient(map: Record<number | string, string>): ColorStop[] {
  return Object.entries(map)
    .map(([k, v]) => ({ temp: Number(k), color: v }))
    .filter(s => Number.isFinite(s.temp))
    .sort((a, b) => a.temp - b.temp)
}

function toRgb(hexString: string): [number, number, number] | null {
  const c = hexString.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c)
  if (hex) {
    const h = hex[1]
    if (h.length === 3) {
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const rgb = /^rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(c)
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  }
  return null
}

function toHex(rgb: [number, number, number]): string {
  const part = (n: number): string => Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0')
  return `#${part(rgb[0])}${part(rgb[1])}${part(rgb[2])}`
}

export function interpolateColor(stops: ColorStop[], temp: number): string {
  if (stops.length === 0) return '#888888'
  if (stops.length === 1) return stops[0].color
  if (temp <= stops[0].temp) return stops[0].color
  if (temp >= stops[stops.length - 1].temp) return stops[stops.length - 1].color

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (temp >= a.temp && temp <= b.temp) {
      const rgbA = toRgb(a.color)
      const rgbB = toRgb(b.color)
      // Fall back to the lower stop's color when one of the configured values is not a
      // hex / rgb() string we can parse — the gradient still renders, just without a
      // smooth blend at this exact bracket.
      if (!rgbA || !rgbB) return a.color
      const t = (temp - a.temp) / (b.temp - a.temp)
      return toHex([
        rgbA[0] + (rgbB[0] - rgbA[0]) * t,
        rgbA[1] + (rgbB[1] - rgbA[1]) * t,
        rgbA[2] + (rgbB[2] - rgbA[2]) * t,
      ])
    }
  }
  return stops[0].color
}

export function gradientStopsForRange(stops: ColorStop[], lowC: number, highC: number): GradientStop[] {
  if (stops.length === 0) return [{ percent: 0, color: '#888888' }, { percent: 100, color: '#888888' }]
  if (highC <= lowC) {
    const c = interpolateColor(stops, lowC)
    return [{ percent: 0, color: c }, { percent: 100, color: c }]
  }
  const result: GradientStop[] = [{ percent: 0, color: interpolateColor(stops, lowC) }]
  for (const s of stops) {
    if (s.temp > lowC && s.temp < highC) {
      result.push({ percent: ((s.temp - lowC) / (highC - lowC)) * 100, color: s.color })
    }
  }
  result.push({ percent: 100, color: interpolateColor(stops, highC) })
  return result
}

export function toCelsius(value: number, unit: string | null | undefined): number {
  if (unit === '°F') return (value - 32) * 5 / 9
  return value
}
