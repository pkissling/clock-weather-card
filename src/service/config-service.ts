import type { ClockWeatherCardConfig, MergedClockWeatherCardConfig } from '@/types'

class ConfigService {

  public mergeWithDefaultConfig(config: ClockWeatherCardConfig): MergedClockWeatherCardConfig {
    return {
      entity: config.entity,
      title: config.title ?? null,
      sun_entity: config.sun_entity ?? 'sun.sun',
      weather_icon_type: config.weather_icon_type ?? 'line',
      animated_icon: config.animated_icon ?? true
    }
  }
}

export default new ConfigService()
