import type { WeatherIconType } from '@/types'

type IconKind = 'svg' | 'svg-static'

interface IconIndex {
  [type: string]: {
    [kind in IconKind]?: Map<string, string>
  }
}

class IconsService {
  private index: IconIndex

  constructor() {
    // Eagerly import all SVGs so the URLs are available synchronously
    const modules = import.meta.glob('../icons/*/{svg,svg-static}/*.svg', {
      eager: true,
      import: 'default'
    }) as Record<string, string>

    this.index = Object.entries(modules).reduce((acc, [path, url]) => {
      // path example: ../icons/line/svg/clear-day.svg
      const match = path.match(/\.\.\/icons\/(fill|line|monochrome)\/(svg|svg-static)\/([^/]+)\.svg$/)
      if (!match) return acc
      const [, type, kind, name] = match as unknown as [string, WeatherIconType, IconKind, string]
      if (!acc[type]) acc[type] = {}
      if (!acc[type][kind]) acc[type][kind] = new Map<string, string>()
      acc[type][kind]!.set(name, url)
      return acc
    }, {} as IconIndex)
  }

  public getWeatherIcon(type: WeatherIconType, animated: boolean, weatherState: string, isNight: boolean): string {
    const kind: IconKind = type === 'monochrome' ? 'svg-static' : (animated ? 'svg' : 'svg-static')

    const iconFileName = this.mapWeatherStateToIconFileName(weatherState, isNight)
    const bucket = this.index[type]?.[kind]
    if (bucket?.has(iconFileName)) {
      return bucket.get(iconFileName)!
    }

    // TODO test!
    throw new Error(`Icon for weather state "${weatherState}" (${iconFileName}) not found in type "${type}" (${kind})`)
  }

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
