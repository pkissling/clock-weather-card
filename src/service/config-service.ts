import type { ClockWeatherCardConfig, MergedClockWeatherCardConfig, RowConfig } from '@/types'

const DEFAULT_ROWS: RowConfig[] = [
  {
    segments: [
      { type: 'icon', icon: 'mdi:thermometer' },
      { type: 'weather', attribute: 'temperature' },
      { type: 'spacer' },
      { type: 'weather' },
      { type: 'icon', icon: 'mdi:weather-partly-cloudy' }
    ]
  },
  {
    font_size: '4rem',
    segments: [
      { type: 'spacer' },
      { type: 'time' },
      { type: 'spacer' }
    ]
  },
  {
    segments: [
      { type: 'spacer' },
      { type: 'icon', icon: 'mdi:calendar' },
      { type: 'date' },
      { type: 'spacer' }
    ]
  }
]

class ConfigService {

  public mergeWithDefaultConfig(config: ClockWeatherCardConfig): MergedClockWeatherCardConfig {
    return {
      entity: config.entity,
      title: config.title ?? null,
      sun_entity: config.sun_entity ?? 'sun.sun',
      weather_icon_type: config.weather_icon_type ?? 'line',
      rows: config.rows ?? DEFAULT_ROWS
    }
  }
}

export default new ConfigService()
