import { describe, expect, it } from 'vitest'

import iconsService, { scaleAnimationTimings } from '@/service/icons-service'
import { WEATHER_ICON_TYPES } from '@/types'

describe('getWeatherIcon', () => {
  const states = ['clear-night', 'clear', 'sunny', 'partlycloudy', 'cloudy', 'fog', 'hail', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy', 'snowy-rainy', 'windy', 'windy-variant', 'windy-exceptional', 'exceptional', 'sunrise', 'sunset']

  it.each(WEATHER_ICON_TYPES.flatMap(type => states.flatMap(state => [true, false].flatMap(animated => [true, false].map(isNight => [type, state, animated, isNight] as const)))))('ships a %s icon for %s (animated: %s, night: %s)', (type, state, animated, isNight) => {
    expect(iconsService.getWeatherIcon(type, animated, state, isNight))
      .toBeDefined()
  })
})

describe('scaleAnimationTimings', () => {
  it('stretches dur and begin by the inverse of the speed', () => {
    expect(scaleAnimationTimings('<animateTransform dur="6s" begin="-0.8s" values="0 64 64;360 64 64"/>', 0.5))
      .toBe('<animateTransform dur="12s" begin="-1.6s" values="0 64 64;360 64 64"/>')
  })

  it('speeds animations up for a speed above 1', () => {
    expect(scaleAnimationTimings('<animate dur="3s" begin="0s"/>', 2))
      .toBe('<animate dur="1.5s" begin="0s"/>')
  })

  it('rounds away floating point noise', () => {
    expect(scaleAnimationTimings('<animate begin="-0.19999999999999996s"/>', 0.3))
      .toBe('<animate begin="-0.667s"/>')
  })

  it('leaves other attributes untouched', () => {
    const svg = '<path d="M1 2s3 4"/><animate keyTimes="0;1" values="1s;2s"/>'
    expect(scaleAnimationTimings(svg, 0.5))
      .toBe(svg)
  })
})
