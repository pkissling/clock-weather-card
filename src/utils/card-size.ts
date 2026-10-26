import type { ResolvedConfig } from '@/types'

const CARD_SIZE_UNIT_PX = 50
const PADDING_PX = 36
const TITLE_PX = 24
const HEADER_MIN_PX = 126
const HEADER_ROW_PX = 17
const FORECAST_STRIP_PX = 88
const SENSORS_PX = 72

const cssLengthToPx = (length: string | undefined): number | null => {
  const match = /^([\d.]+)(px|r?em)$/.exec(length ?? '')
  return match ? Number(match[1]) * (match[2] === 'px' ? 1 : 16) : null
}

// shortcut: estimates from config instead of measuring, since HA asks before the card has rendered.
export const estimateCardSize = ({ title, header, forecast_strip, forecast_list, sensors }: ResolvedConfig): number => {
  const rowsPx = header.rows.reduce((sum, row) => sum + (cssLengthToPx(row.font_size) ?? HEADER_ROW_PX), 0)
  const px = PADDING_PX
    + (title ? TITLE_PX : 0)
    + (header.hide ? 0 : Math.max(HEADER_MIN_PX, rowsPx))
    + (forecast_strip.hide ? 0 : FORECAST_STRIP_PX)
    + (forecast_list.hide ? 0 : forecast_list.count * (cssLengthToPx(forecast_list.row_height) ?? 28))
    + (sensors.hide || !sensors.entities.length ? 0 : SENSORS_PX * (sensors.show_name ? 1.25 : 1))
  return Math.round(px / CARD_SIZE_UNIT_PX)
}
