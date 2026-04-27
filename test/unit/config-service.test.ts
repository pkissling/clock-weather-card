import type { HomeAssistant } from 'custom-card-helpers'
import { describe, expect, it } from 'vitest'

import configService from '@/service/config-service'

describe('configService', () => {
  const baseConfig = { type: 'custom:clock-weather-card', entity: 'weather.home' }

  describe('getEntity', () => {
    it('returns the entity', () => {
      expect(configService.getEntity(baseConfig))
        .toBe('weather.home')
    })
  })

  describe('getTitle', () => {
    it('returns title when provided', () => {
      expect(configService.getTitle({ ...baseConfig, title: 'My Weather' }))
        .toBe('My Weather')
    })

    it('returns null when not provided', () => {
      expect(configService.getTitle(baseConfig))
        .toBeNull()
    })
  })

  describe('getSunEntity', () => {
    it('returns configured sun entity', () => {
      expect(configService.getSunEntity({ ...baseConfig, sun_entity: 'sun.custom' }))
        .toBe('sun.custom')
    })

    it('defaults to sun.sun', () => {
      expect(configService.getSunEntity(baseConfig))
        .toBe('sun.sun')
    })
  })

  describe('getWeatherIconType', () => {
    it('returns configured type', () => {
      expect(configService.getWeatherIconType({ ...baseConfig, weather_icon_type: 'fill' }))
        .toBe('fill')
    })

    it('defaults to line', () => {
      expect(configService.getWeatherIconType(baseConfig))
        .toBe('line')
    })
  })

  describe('getAnimatedIcon', () => {
    it('returns configured value', () => {
      expect(configService.getAnimatedIcon({ ...baseConfig, animated_icon: false }))
        .toBe(false)
    })

    it('defaults to true', () => {
      expect(configService.getAnimatedIcon(baseConfig))
        .toBe(true)
    })
  })

  describe('getTimeZone', () => {
    const hassWithTz = { config: { time_zone: 'Europe/London' } } as HomeAssistant
    const hassWithoutTz = { config: {} } as HomeAssistant

    it('returns configured time zone when set', () => {
      expect(configService.getTimeZone({ ...baseConfig, time_zone: 'America/New_York' }, hassWithTz))
        .toBe('America/New_York')
    })

    it('falls back to hass time zone when config time_zone is not set', () => {
      expect(configService.getTimeZone(baseConfig, hassWithTz))
        .toBe('Europe/London')
    })

    it('returns undefined when neither config nor hass has a time zone', () => {
      expect(configService.getTimeZone(baseConfig, hassWithoutTz))
        .toBeUndefined()
    })
  })

  describe('getRows', () => {
    it('returns configured rows', () => {
      const rows = [{ segments: [{ type: 'time' as const, time_pattern: 'HH:mm:ss' }] }]
      expect(configService.getRows({ ...baseConfig, rows }))
        .toBe(rows)
    })

    it('returns default rows when not provided', () => {
      const rows = configService.getRows(baseConfig)
      expect(rows)
        .toHaveLength(3)
      expect(rows[1].segments.some(s => s.type === 'time'))
        .toBe(true)
    })
  })
})
