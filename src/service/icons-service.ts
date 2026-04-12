import type { WeatherIconType } from '@/types'

interface IconIndex {
  [type: string]: Map<string, string>
}

class IconsService {
  private index: IconIndex

  constructor() {
    // Eagerly import all SVGs so the URLs are available synchronously
    const modules = import.meta.glob('/node_modules/@meteocons/svg/{fill,flat,line,monochrome}/*.svg', {
      eager: true,
      import: 'default'
    }) as Record<string, string>

    this.index = Object.entries(modules)
      .reduce((acc, [path, url]) => {
        const match = path.match(/\/@meteocons\/svg\/(fill|flat|line|monochrome)\/([^/]+)\.svg$/)
        if (!match) return acc
        const [, type, name] = match as unknown as [string, WeatherIconType, string]
        if (!acc[type]) acc[type] = new Map<string, string>()
        acc[type].set(name, url)
        return acc
      }, {} as IconIndex)
  }

  public getWeatherIcon(type: WeatherIconType, weatherState: string, isNight: boolean): string {
    const iconFileName = this.mapWeatherStateToIconFileName(weatherState, isNight)
    const bucket = this.index[type]
    if (bucket?.has(iconFileName)) {
      return bucket.get(iconFileName)!
    }

    throw new Error(`Icon for weather state "${weatherState}" (${iconFileName}) not found in type "${type}"`)
  }

  // TODO: Review mapping between HA weather states and meteocons icon names — there may be more suitable icons available.
  private mapWeatherStateToIconFileName(state: string, isNight: boolean): string {
    const s = state.toLowerCase()
    const dn = isNight ? 'night' : 'day'

    switch (s) {
    case 'clear-night':
      return 'clear-night'
    case 'clear':
    case 'sunny':
      return `clear-${dn}`
    case 'partlycloudy':
      return `partly-cloudy-${dn}`
    case 'cloudy':
      return 'cloudy'
    case 'fog':
      return `fog-${dn}`
    case 'hail':
      return 'hail'
    case 'lightning':
      return `thunderstorms-${dn}`
    case 'lightning-rainy':
      return `thunderstorms-${dn}-rain`
    case 'pouring':
      return 'rain'
    case 'rainy':
      // Matches previous choice of partly-cloudy-*-rain
      return `partly-cloudy-${dn}-rain`
    case 'snowy':
      return 'snow'
    case 'snowy-rainy':
      return 'sleet'
    case 'windy':
    case 'windy-variant':
    case 'windy-exceptional':
      return 'windsock'
    case 'exceptional':
      return 'hurricane'
    case 'raindrop':
      return 'raindrop'
    case 'raindrops':
      return 'raindrops'
    default:
      // Try raw state first; if caller passes e.g. 'overcast-day-rain', it will resolve
      return s
    }
  }
}

export default new IconsService()
