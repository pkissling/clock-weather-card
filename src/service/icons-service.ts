import type { WeatherIconType } from '@/types'

type IconLoader = () => Promise<string>

interface IconIndex {
  [type: string]: Map<string, IconLoader>
}

class IconsService {
  private staticIndex: IconIndex
  private animatedIndex: IconIndex
  private cache = new Map<string, Promise<string>>()

  constructor() {
    const staticModules = import.meta.glob('/node_modules/@meteocons/svg-static/{fill,flat,line,monochrome}/*.svg', {
      import: 'default'
    }) as Record<string, IconLoader>
    this.staticIndex = this.buildIndex(staticModules, /\/@meteocons\/svg-static\/(fill|flat|line|monochrome)\/([^/]+)\.svg$/)

    const animatedModules = import.meta.glob('/node_modules/@meteocons/svg/{fill,flat,line,monochrome}/*.svg', {
      import: 'default'
    }) as Record<string, IconLoader>
    this.animatedIndex = this.buildIndex(animatedModules, /\/@meteocons\/svg\/(fill|flat|line|monochrome)\/([^/]+)\.svg$/)
  }

  private buildIndex(modules: Record<string, IconLoader>, pattern: RegExp): IconIndex {
    return Object.entries(modules)
      .reduce((acc, [path, loader]) => {
        const match = path.match(pattern)
        if (!match) return acc
        const [, type, name] = match as unknown as [string, WeatherIconType, string]
        if (!acc[type]) acc[type] = new Map<string, IconLoader>()
        acc[type].set(name, loader)
        return acc
      }, {} as IconIndex)
  }

  public getWeatherIcon(type: WeatherIconType, animated: boolean, weatherState: string, isNight: boolean): Promise<string> {
    const iconFileName = this.mapWeatherStateToIconFileName(weatherState, isNight)
    const cacheKey = `${animated ? 'a' : 's'}/${type}/${iconFileName}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached

    const index = animated ? this.animatedIndex : this.staticIndex
    const loader = index[type]?.get(iconFileName)
    if (!loader) {
      return Promise.reject(new Error(`Icon for weather state "${weatherState}" (${iconFileName}) not found in type "${type}"`))
    }

    const promise = loader()
    this.cache.set(cacheKey, promise)
    return promise
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
