import type { ResolvedConfig } from '@/types'

// Mirrors the HA frontend's mapping of the user's number format setting.
const NUMBER_FORMAT_LOCALES: Record<string, string[] | undefined> = {
  comma_decimal: ['en-US', 'en'],
  decimal_comma: ['de', 'es', 'it'],
  space_comma: ['fr', 'sv', 'cs'],
  quote_decimal: ['de-CH'],
  system: undefined,
}

export function formatNumber(value: number, { locale, numberFormat }: Pick<ResolvedConfig, 'locale' | 'numberFormat'>, precision: number | null = null): string {
  // A value that rounds to zero keeps its sign otherwise (-0.4 -> "-0"); 3 is Intl's default maximumFractionDigits.
  const signed = Number(value.toFixed(precision ?? 3)) === 0 ? 0 : value
  if (numberFormat === 'none') return precision === null ? String(value) : signed.toFixed(precision)
  const digits = precision === null ? {} : { minimumFractionDigits: precision, maximumFractionDigits: precision }
  return new Intl.NumberFormat(numberFormat in NUMBER_FORMAT_LOCALES ? NUMBER_FORMAT_LOCALES[numberFormat] : locale, digits)
    .format(signed)
}
