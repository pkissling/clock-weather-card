import type { ResolvedConfig } from '@/types'

const CARD_SIZE_UNIT_PX = 50
const PADDING_PX = 36
const TITLE_PX = 24
const HEADER_MIN_PX = 126
const HEADER_ROW_PX = 17
const FORECAST_STRIP_PX = 74
const FORECAST_STRIP_ATTRIBUTE_PX = 14

const cssLengthToPx = (length: string | undefined): number | null => {
  const match = /^([\d.]+)(px|r?em)$/.exec(length ?? '')
  return match ? Number(match[1]) * (match[2] === 'px' ? 1 : 16) : null
}

// shortcut: estimates from config instead of measuring, since HA asks before the card has rendered.
export const estimateCardSize = ({ title, header, forecastStrip, forecastList }: ResolvedConfig): number => {
  const rowsPx = header.rows.reduce((sum, row) => sum + (cssLengthToPx(row.font_size) ?? HEADER_ROW_PX), 0)
  const px = PADDING_PX
    + (title ? TITLE_PX : 0)
    + (header.hidden ? 0 : Math.max(HEADER_MIN_PX, rowsPx))
    + (forecastStrip.hidden ? 0 : FORECAST_STRIP_PX + forecastStrip.attributes.length * FORECAST_STRIP_ATTRIBUTE_PX)
    + (forecastList.hidden ? 0 : forecastList.count * (cssLengthToPx(forecastList.rowHeight) ?? 28))
  return Math.round(px / CARD_SIZE_UNIT_PX)
}
