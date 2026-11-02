import type { ClockWeatherCardConfig } from '@/types'

type Sections = NonNullable<ClockWeatherCardConfig['sections']>

// Starter layouts of the editor; applying one replaces the card's whole `sections`. The README gallery shows each one.
export const PRESETS = {
  default: {},
  classic: {
    header: {
      rows: [
        { alignment: 'right', segments: [{ type: 'weather' }, { type: 'weather', attribute: 'temperature' }] },
        { font_size: '4rem', alignment: 'right', segments: [{ type: 'time' }] },
        { alignment: 'right', segments: [{ type: 'date' }] },
      ],
    },
    forecast_strip: { hide: true },
  },
  wall_tablet: {
    header: {
      rows: [
        { font_size: '1.5rem', segments: [{ type: 'weather', attribute: 'temperature' }, { type: 'spacer' }, { type: 'weather' }] },
        { font_size: '7rem', alignment: 'center', segments: [{ type: 'time' }] },
        { font_size: '1.5rem', alignment: 'center', segments: [{ type: 'date' }] },
      ],
    },
    forecast_strip: { count: 8, font_size: '1.5rem' },
    forecast_list: { font_size: '1.5rem', row_height: '40px' },
  },
  minimal_clock: {
    header: {
      rows: [
        { font_size: '5rem', alignment: 'center', segments: [{ type: 'time' }] },
        { alignment: 'center', segments: [{ type: 'date' }] },
      ],
    },
    forecast_strip: { hide: true },
    forecast_list: { hide: true },
  },
  compact: {
    header: {
      weather_icon_size: '4rem',
      rows: [
        { font_size: '1.5rem', segments: [{ type: 'time' }, { type: 'date' }, { type: 'spacer' }, { type: 'weather', attribute: 'temperature' }] },
      ],
    },
    forecast_list: { hide: true },
  },
} satisfies Record<string, Sections>

export type PresetKey = keyof typeof PRESETS
