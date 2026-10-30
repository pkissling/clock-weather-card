import logger from '@/service/logger'
import type { WeatherIconType } from '@/types'

const MDI_WEATHER_STATES = new Set(['cloudy', 'fog', 'hail', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy', 'snowy-rainy', 'windy', 'windy-variant'])

// Only icons mapWeatherStateToIconFileName can return; each ships as a plain .svg file so the browser fetches it on demand.
const iconUrls = import.meta.glob('/node_modules/@meteocons/{svg,svg-static}/{fill,flat,line,monochrome}/{clear-day,clear-night,partly-cloudy-day,partly-cloudy-night,cloudy,fog-day,fog-night,hail,extreme-rain,not-available,thunderstorms-day,thunderstorms-night,thunderstorms-day-rain,thunderstorms-night-rain,rain,snow,sleet,wind,wind-alert,weather-alert,sunrise,sunset}.svg', {
  query: '?url&no-inline',
  import: 'default',
  eager: true
}) as Record<string, string>

// Meteocons animate with SMIL timings, which CSS cannot reach inside an <img>, so a different speed is baked into a copy of the SVG.
export function scaleAnimationTimings(svg: string, speed: number): string {
  return svg.replace(/\b(dur|begin)="(-?\d*\.?\d+)s"/g, (_, attr: string, seconds: string) => `${attr}="${Number((Number(seconds) / speed).toFixed(3))}s"`)
}

class IconsService {
  private readonly speedAdjustedIcons = new Map<string, Promise<string>>()

  public getWeatherIcon(type: WeatherIconType, animated: boolean, weatherState: string, isNight: boolean): string | undefined {
    const iconFileName = this.mapWeatherStateToIconFileName(weatherState, isNight)
    const lookup = (pkg: string): string | undefined => iconUrls[`/node_modules/@meteocons/${pkg}/${type}/${iconFileName}.svg`]
    const url = (animated && lookup('svg')) || lookup('svg-static')
    // Dev mode yields a root-relative path that must resolve against the dev server, not the Home Assistant page.
    return url && import.meta.env.DEV ? new URL(url, import.meta.url).href : url
  }

  public getSpeedAdjustedIcon(url: string, speed: number): Promise<string> {
    const key = `${speed}|${url}`
    let icon = this.speedAdjustedIcons.get(key)
    if (!icon) {
      icon = fetch(url)
        .then(res => res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`)))
        .then(svg => URL.createObjectURL(new Blob([scaleAnimationTimings(svg, speed)], { type: 'image/svg+xml' })))
        .catch((e: unknown) => {
          logger.warn(`Could not change the animation speed of ${url}, showing it at normal speed`, e)
          this.speedAdjustedIcons.delete(key)
          return url
        })
      this.speedAdjustedIcons.set(key, icon)
    }
    return icon
  }

  public getWeatherMdiIcon(weatherState: string, isNight: boolean): string {
    const s = weatherState.toLowerCase()
    if (s === 'sunny' || s === 'clear' || s === 'clear-night') return isNight ? 'mdi:weather-night' : 'mdi:weather-sunny'
    if (s === 'partlycloudy') return isNight ? 'mdi:weather-night-partly-cloudy' : 'mdi:weather-partly-cloudy'
    if (s === 'windy-exceptional') return 'mdi:weather-windy'
    if (s === 'exceptional') return 'mdi:alert-circle-outline'
    if (MDI_WEATHER_STATES.has(s)) return `mdi:weather-${s}`
    logger.warn(`No MDI icon for weather state "${weatherState}", using fallback icon`)
    return 'mdi:weather-cloudy-alert'
  }

  private mapWeatherStateToIconFileName(state: string, isNight: boolean): string {
    const s = state.toLowerCase()
    const dn = isNight ? 'night' : 'day'

    switch (s) {
    case 'clear-night':
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
      return 'extreme-rain'
    case 'rainy':
      return 'rain'
    case 'snowy':
      return 'snow'
    case 'snowy-rainy':
      return 'sleet'
    case 'windy':
    case 'windy-variant':
      return 'wind'
    case 'windy-exceptional':
      return 'wind-alert'
    case 'exceptional':
      return 'weather-alert'
    case 'sunrise':
    case 'sunset':
      return s
    default:
      logger.warn(`No icon for weather state "${state}", showing the not-available icon`)
      return 'not-available'
    }
  }
}

export default new IconsService()
