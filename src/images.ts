import staticFillPartlyCloudyNightRain from './icons/fill/svg-static/partly-cloudy-night-rain.svg'
import staticLinePartlyCloudyNightRain from './icons/line/svg-static/partly-cloudy-night-rain.svg'
import staticFillPartlyCloudyDayRain from './icons/fill/svg-static/partly-cloudy-day-rain.svg'
import staticLinePartlyCloudyDayRain from './icons/line/svg-static/partly-cloudy-day-rain.svg'
import staticFillPartlyCloudyNight from './icons/fill/svg-static/partly-cloudy-night.svg'
import staticLinePartlyCloudyNight from './icons/line/svg-static/partly-cloudy-night.svg'
import staticFillPartlyCloudyDay from './icons/fill/svg-static/partly-cloudy-day.svg'
import staticLinePartlyCloudyDay from './icons/line/svg-static/partly-cloudy-day.svg'
import staticFillCloudy from './icons/fill/svg-static/cloudy.svg'
import staticLineCloudy from './icons/line/svg-static/cloudy.svg'
import staticFillClearNight from './icons/fill/svg-static/clear-night.svg'
import staticLineClearNight from './icons/line/svg-static/clear-night.svg'
import staticFillFogNight from './icons/fill/svg-static/fog-night.svg'
import staticLineFogNight from './icons/line/svg-static/fog-night.svg'
import staticFillFogDay from './icons/fill/svg-static/fog-day.svg'
import staticLineFogDay from './icons/line/svg-static/fog-day.svg'
import staticFillHail from './icons/fill/svg-static/hail.svg'
import staticLineHail from './icons/line/svg-static/hail.svg'
import staticFillThunderstormsNight from './icons/fill/svg-static/thunderstorms-night.svg'
import staticLineThunderstormsNight from './icons/line/svg-static/thunderstorms-night.svg'
import staticFillThunderstormsDay from './icons/fill/svg-static/thunderstorms-day.svg'
import staticLineThunderstormsDay from './icons/line/svg-static/thunderstorms-day.svg'
import staticFillThunderstormsRainNight from './icons/fill/svg-static/thunderstorms-night-rain.svg'
import staticLineThunderstormsRainNight from './icons/line/svg-static/thunderstorms-night-rain.svg'
import staticFillThunderstormsRainDay from './icons/fill/svg-static/thunderstorms-day-rain.svg'
import staticLineThunderstormsRainDay from './icons/line/svg-static/thunderstorms-day-rain.svg'
import staticFillRain from './icons/fill/svg-static/rain.svg'
import staticLineRain from './icons/line/svg-static/rain.svg'
import staticFillSnow from './icons/fill/svg-static/snow.svg'
import staticLineSnow from './icons/line/svg-static/snow.svg'
import staticFillSleet from './icons/fill/svg-static/sleet.svg'
import staticLineSleet from './icons/line/svg-static/sleet.svg'
import staticFillClearDay from './icons/fill/svg-static/clear-day.svg'
import staticLineClearDay from './icons/line/svg-static/clear-day.svg'
import staticFillWindsock from './icons/fill/svg-static/windsock.svg'
import staticLineWindsock from './icons/line/svg-static/windsock.svg'
import staticFillHurricane from './icons/fill/svg-static/hurricane.svg'
import staticLineHurricane from './icons/line/svg-static/hurricane.svg'
import staticFillRaindrops from './icons/fill/svg-static/raindrops.svg'
import staticLineRaindrops from './icons/line/svg-static/raindrops.svg'
import staticFillRaindrop from './icons/fill/svg-static/raindrop.svg'
import staticLineRaindrop from './icons/line/svg-static/raindrop.svg'

export const staticIcons = {
  line: {
    rainy: {
      day: staticLinePartlyCloudyDayRain,
      night: staticLinePartlyCloudyNightRain
    },
    partlycloudy: {
      day: staticLinePartlyCloudyDay,
      night: staticLinePartlyCloudyNight
    },
    cloudy: staticLineCloudy,
    'clear-night': {
      day: staticLineClearDay,
      night: staticLineClearNight
    },
    fog: {
      day: staticLineFogDay,
      night: staticLineFogNight
    },
    hail: staticLineHail,
    lightning: {
      day: staticLineThunderstormsDay,
      night: staticLineThunderstormsNight
    },
    'lightning-rainy': {
      day: staticLineThunderstormsRainDay,
      night: staticLineThunderstormsRainNight
    },
    pouring: staticLineRain,
    raindrop: staticLineRaindrop,
    raindrops: staticLineRaindrops,
    snowy: staticLineSnow,
    'snowy-rainy': staticLineSleet,
    sunny: {
      day: staticLineClearDay,
      night: staticLineClearNight
    },
    windy: staticLineWindsock,
    'windy-exceptional': staticLineWindsock,
    exceptional: staticLineHurricane
  },
  fill: {
    rainy: {
      day: staticFillPartlyCloudyDayRain,
      night: staticFillPartlyCloudyNightRain
    },
    partlycloudy: {
      day: staticFillPartlyCloudyDay,
      night: staticFillPartlyCloudyNight
    },
    cloudy: staticFillCloudy,
    'clear-night': {
      day: staticFillClearDay,
      night: staticFillClearNight
    },
    fog: {
      day: staticFillFogDay,
      night: staticFillFogNight
    },
    hail: staticFillHail,
    lightning: {
      day: staticFillThunderstormsDay,
      night: staticFillThunderstormsNight
    },
    'lightning-rainy': {
      day: staticFillThunderstormsRainDay,
      night: staticFillThunderstormsRainNight
    },
    pouring: staticFillRain,
    raindrop: staticFillRaindrop,
    raindrops: staticFillRaindrops,
    snowy: staticFillSnow,
    'snowy-rainy': staticFillSleet,
    sunny: {
      day: staticFillClearDay,
      night: staticFillClearNight
    },
    windy: staticFillWindsock,
    'windy-exceptional': staticFillWindsock,
    exceptional: staticFillHurricane
  }
}
