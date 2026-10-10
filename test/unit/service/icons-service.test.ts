import { describe, expect, it } from 'vitest'

import iconsService from '@/service/icons-service'
import { WEATHER_ICON_TYPES } from '@/types'

describe('getWeatherIcon', () => {
  const states = ['clear-night', 'clear', 'sunny', 'partlycloudy', 'cloudy', 'fog', 'hail', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy', 'snowy-rainy', 'windy', 'windy-variant', 'windy-exceptional', 'exceptional', 'sunrise', 'sunset']

  it.each(WEATHER_ICON_TYPES.flatMap(type => states.flatMap(state => [true, false].flatMap(animated => [true, false].map(isNight => [type, state, animated, isNight] as const)))))('ships a %s icon for %s (animated: %s, night: %s)', (type, state, animated, isNight) => {
    expect(iconsService.getWeatherIcon(type, animated, state, isNight))
      .toBeDefined()
  })
})
