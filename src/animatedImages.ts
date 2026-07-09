import animatedFillPartlyCloudyNightRain from './icons/fill/svg/partly-cloudy-night-rain.svg'
import animatedLinePartlyCloudyNightRain from './icons/line/svg/partly-cloudy-night-rain.svg'
import animatedFillPartlyCloudyDayRain from './icons/fill/svg/partly-cloudy-day-rain.svg'
import animatedLinePartlyCloudyDayRain from './icons/line/svg/partly-cloudy-day-rain.svg'
import animatedFillPartlyCloudyNight from './icons/fill/svg/partly-cloudy-night.svg'
import animatedLinePartlyCloudyNight from './icons/line/svg/partly-cloudy-night.svg'
import animatedFillPartlyCloudyDay from './icons/fill/svg/partly-cloudy-day.svg'
import animatedLinePartlyCloudyDay from './icons/line/svg/partly-cloudy-day.svg'
import animatedFillCloudy from './icons/fill/svg/cloudy.svg'
import animatedLineCloudy from './icons/line/svg/cloudy.svg'
import animatedFillClearNight from './icons/fill/svg/clear-night.svg'
import animatedLineClearNight from './icons/line/svg/clear-night.svg'
import animatedFillFogNight from './icons/fill/svg/fog-night.svg'
import animatedLineFogNight from './icons/line/svg/fog-night.svg'
import animatedFillFogDay from './icons/fill/svg/fog-day.svg'
import animatedLineFogDay from './icons/line/svg/fog-day.svg'
import animatedFillHail from './icons/fill/svg/hail.svg'
import animatedLineHail from './icons/line/svg/hail.svg'
import animatedFillThunderstormsNight from './icons/fill/svg/thunderstorms-night.svg'
import animatedLineThunderstormsNight from './icons/line/svg/thunderstorms-night.svg'
import animatedFillThunderstormsDay from './icons/fill/svg/thunderstorms-day.svg'
import animatedLineThunderstormsDay from './icons/line/svg/thunderstorms-day.svg'
import animatedFillThunderstormsRainNight from './icons/fill/svg/thunderstorms-night-rain.svg'
import animatedLineThunderstormsRainNight from './icons/line/svg/thunderstorms-night-rain.svg'
import animatedFillThunderstormsRainDay from './icons/fill/svg/thunderstorms-day-rain.svg'
import animatedLineThunderstormsRainDay from './icons/line/svg/thunderstorms-day-rain.svg'
import animatedFillRain from './icons/fill/svg/rain.svg'
import animatedLineRain from './icons/line/svg/rain.svg'
import animatedFillSnow from './icons/fill/svg/snow.svg'
import animatedLineSnow from './icons/line/svg/snow.svg'
import animatedFillSleet from './icons/fill/svg/sleet.svg'
import animatedLineSleet from './icons/line/svg/sleet.svg'
import animatedFillClearDay from './icons/fill/svg/clear-day.svg'
import animatedLineClearDay from './icons/line/svg/clear-day.svg'
import animatedFillWindsock from './icons/fill/svg/windsock.svg'
import animatedLineWindsock from './icons/line/svg/windsock.svg'
import animatedFillHurricane from './icons/fill/svg/hurricane.svg'
import animatedLineHurricane from './icons/line/svg/hurricane.svg'
import animatedLineRaindrops from './icons/line/svg/raindrops.svg'
import animatedFillRaindrops from './icons/fill/svg/raindrops.svg'
import animatedLineRaindrop from './icons/line/svg/raindrop.svg'
import animatedFillRaindrop from './icons/fill/svg/raindrop.svg'

export const animatedIcons = {
  line: {
    rainy: {
      day: animatedLinePartlyCloudyDayRain,
      night: animatedLinePartlyCloudyNightRain
    },
    partlycloudy: {
      day: animatedLinePartlyCloudyDay,
      night: animatedLinePartlyCloudyNight
    },
    cloudy: animatedLineCloudy,
    'clear-night': {
      day: animatedLineClearDay,
      night: animatedLineClearNight
    },
    fog: {
      day: animatedLineFogDay,
      night: animatedLineFogNight
    },
    hail: animatedLineHail,
    lightning: {
      day: animatedLineThunderstormsDay,
      night: animatedLineThunderstormsNight
    },
    'lightning-rainy': {
      day: animatedLineThunderstormsRainDay,
      night: animatedLineThunderstormsRainNight
    },
    pouring: animatedLineRain,
    raindrop: animatedLineRaindrop,
    raindrops: animatedLineRaindrops,
    snowy: animatedLineSnow,
    'snowy-rainy': animatedLineSleet,
    sunny: {
      day: animatedLineClearDay,
      night: animatedLineClearNight
    },
    windy: animatedLineWindsock,
    'windy-exceptional': animatedLineWindsock,
    exceptional: animatedLineHurricane
  },
  fill: {
    rainy: {
      day: animatedFillPartlyCloudyDayRain,
      night: animatedFillPartlyCloudyNightRain
    },
    partlycloudy: {
      day: animatedFillPartlyCloudyDay,
      night: animatedFillPartlyCloudyNight
    },
    cloudy: animatedFillCloudy,
    'clear-night': {
      day: animatedFillClearDay,
      night: animatedFillClearNight
    },
    fog: {
      day: animatedFillFogDay,
      night: animatedFillFogNight
    },
    hail: animatedFillHail,
    lightning: {
      day: animatedFillThunderstormsDay,
      night: animatedFillThunderstormsNight
    },
    'lightning-rainy': {
      day: animatedFillThunderstormsRainDay,
      night: animatedFillThunderstormsRainNight
    },
    pouring: animatedFillRain,
    raindrop: animatedFillRaindrop,
    raindrops: animatedFillRaindrops,
    snowy: animatedFillSnow,
    'snowy-rainy': animatedFillSleet,
    sunny: {
      day: animatedFillClearDay,
      night: animatedFillClearNight
    },
    windy: animatedFillWindsock,
    'windy-exceptional': animatedFillWindsock,
    exceptional: animatedFillHurricane
  }
}

