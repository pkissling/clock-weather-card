import { normalizeGradient, toRgb } from '@/utils/gradient'

// The color of the highest band the value reaches; none below the lowest band or without a numeric value.
export function bandColor(bands: Record<number, string>, value: number | null): string | null {
  if (value === null) return null
  return normalizeGradient(bands)
    .filter(s => value >= s.temp)
    .pop()?.color ?? null
}

const luminance = ([r, g, b]: [number, number, number]): number => {
  const lin = (c: number): number => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Black or white, whichever contrasts more (WCAG); null for colors that can't be parsed.
export function contrastTextColor(background: string): string | null {
  const rgb = toRgb(background)
  if (!rgb) return null
  const l = luminance(rgb)
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#000000' : '#ffffff'
}

// Parses an entity state or attribute; anything non-numeric yields null.
export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
