import logger from '@/service/logger'
import type { WeatherIconType } from '@/types'

const MDI_WEATHER_STATES = new Set(['cloudy', 'fog', 'hail', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy', 'snowy-rainy', 'windy', 'windy-variant'])

// Only icons mapWeatherStateToIconFileName can return; each ships as a plain .svg file so the browser fetches it on demand.
const iconUrls = import.meta.glob('/node_modules/@meteocons/{svg,svg-static}/{fill,flat,line,monochrome}/{clear-day,clear-night,partly-cloudy-day,partly-cloudy-night,partly-cloudy-day-rain,partly-cloudy-night-rain,cloudy,fog-day,fog-night,hail,thunderstorms-day,thunderstorms-night,thunderstorms-day-rain,thunderstorms-night-rain,rain,snow,sleet,windsock,hurricane,raindrop,raindrops,sunrise,sunset}.svg', {
  query: '?url&no-inline',
  import: 'default',
  eager: true
}) as Record<string, string>

class IconsService {
  public getWeatherIcon(type: WeatherIconType, animated: boolean, weatherState: string, isNight: boolean): string | undefined {
    const iconFileName = this.mapWeatherStateToIconFileName(weatherState, isNight)
    const lookup = (pkg: string): string | undefined => iconUrls[`/node_modules/@meteocons/${pkg}/${type}/${iconFileName}.svg`]
    const url = (animated && lookup('svg')) || lookup('svg-static')
    // Dev mode yields a root-relative path that must resolve against the dev server, not the Home Assistant page.
    return url && import.meta.env.DEV ? new URL(url, import.meta.url).href : url
  }

  public getWeatherMdiIcon(weatherState: string, isNight: boolean): string {
    const s = weatherState.toLowerCase()
    if (s === 'clear-night') return 'mdi:weather-night'
    if (s === 'sunny' || s === 'clear') return isNight ? 'mdi:weather-night' : 'mdi:weather-sunny'
    if (s === 'partlycloudy') return isNight ? 'mdi:weather-night-partly-cloudy' : 'mdi:weather-partly-cloudy'
    if (s === 'windy-exceptional') return 'mdi:weather-windy'
    if (s === 'exceptional') return 'mdi:alert-circle-outline'
    if (MDI_WEATHER_STATES.has(s)) return `mdi:weather-${s}`
    logger.warn(`No MDI icon for weather state "${weatherState}", using fallback icon`)
    return 'mdi:weather-cloudy-alert'
  }

  // TODO: Review mapping between HA weather states and meteocons icon names - there may be more suitable icons available.
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
      return s
    }
  }
}

export default new IconsService()
