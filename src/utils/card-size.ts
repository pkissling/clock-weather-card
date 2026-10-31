import type { ResolvedConfig } from '@/types'

const CARD_SIZE_UNIT_PX = 50
const PADDING_PX = 36
const TITLE_PX = 24
const HEADER_MIN_PX = 126
const HEADER_ROW_PX = 17
const FORECAST_STRIP_PX = 88

const FORECAST_LIST_ROW_PX = 28

// Home Assistant's root font size.
const REM_PX = 14

const cssLengthToPx = (length: string | undefined): number | null => {
  const match = /^([\d.]+)(px|r?em)$/.exec(length ?? '')
  return match ? Number(match[1]) * (match[2] === 'px' ? 1 : REM_PX) : null
}

// Mirrors the CSS: a configured font size lets the icon, and so the row, grow to twice the text size.
const listRowPx = ({ row_height, font_size }: ResolvedConfig['forecast_list']): number => Math.max(
  cssLengthToPx(row_height) ?? FORECAST_LIST_ROW_PX,
  2 * (cssLengthToPx(font_size ?? undefined) ?? 0),
)

// shortcut: estimates from config instead of measuring, since HA asks before the card has rendered.
export const estimateCardSize = ({ title, header, forecast_strip, forecast_list }: ResolvedConfig): number => {
  const rowsPx = header.rows.reduce((sum, row) => sum + (cssLengthToPx(row.font_size) ?? HEADER_ROW_PX), 0)
  const px = PADDING_PX
    + (title ? TITLE_PX : 0)
    + (header.hide ? 0 : Math.max(HEADER_MIN_PX, rowsPx))
    + (forecast_strip.hide ? 0 : FORECAST_STRIP_PX * (cssLengthToPx(forecast_strip.font_size ?? undefined) ?? REM_PX) / REM_PX)
    + (forecast_list.hide ? 0 : forecast_list.count * listRowPx(forecast_list))
  return Math.round(px / CARD_SIZE_UNIT_PX)
}
