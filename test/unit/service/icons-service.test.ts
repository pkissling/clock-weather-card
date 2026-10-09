import { describe, expect, it } from 'vitest'

import iconsService from '@/service/icons-service'
import { WEATHER_ICON_TYPES } from '@/types'

describe('getWeatherMdiIcon', () => {
  it.each([
    ['clear-night', 'mdi:weather-night'],
    ['sunny', 'mdi:weather-sunny'],
    ['clear', 'mdi:weather-sunny'],
    ['partlycloudy', 'mdi:weather-partly-cloudy'],
    ['rainy', 'mdi:weather-rainy'],
    ['RAINY', 'mdi:weather-rainy'],
    ['windy-exceptional', 'mdi:weather-windy'],
    ['exceptional', 'mdi:alert-circle-outline'],
    ['unknown', 'mdi:weather-cloudy-alert'],
  ])('maps %s by day to %s', (state, icon) => {
    expect(iconsService.getWeatherMdiIcon(state, false))
      .toBe(icon)
  })

  it.each([
    ['sunny', 'mdi:weather-night'],
    ['partlycloudy', 'mdi:weather-night-partly-cloudy'],
    ['rainy', 'mdi:weather-rainy'],
  ])('maps %s by night to %s', (state, icon) => {
    expect(iconsService.getWeatherMdiIcon(state, true))
      .toBe(icon)
  })
})

describe('getWeatherIcon', () => {
  const states = ['clear-night', 'clear', 'sunny', 'partlycloudy', 'cloudy', 'fog', 'hail', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy', 'snowy-rainy', 'windy', 'windy-variant', 'windy-exceptional', 'exceptional', 'raindrop', 'raindrops', 'sunrise', 'sunset']

  it.each(WEATHER_ICON_TYPES.flatMap(type => states.flatMap(state => [true, false].flatMap(animated => [true, false].map(isNight => [type, state, animated, isNight] as const)))))('ships a %s icon for %s (animated: %s, night: %s)', (type, state, animated, isNight) => {
    expect(iconsService.getWeatherIcon(type, animated, state, isNight))
      .toBeDefined()
  })

  it('returns undefined for an unknown state', () => {
    expect(iconsService.getWeatherIcon('line', true, 'unknown', false))
      .toBeUndefined()
  })
})
