import { WEATHER_ICON_TYPES } from '../../src/types'
import { expect, test } from '../utils/fixtures'
import { dailyForecast, DEFAULT_DATE, hourlyForecast } from '../utils/test-utils'

export const supportedWeatherStates = [
  'rainy',
  'partlycloudy',
  'cloudy',
  'clear-night',
  'fog',
  'sunny',
  'lightning',
  'lightning-rainy',
  'pouring',
  'snowy',
  'snowy-rainy',
  'hail',
  'windy',
  'windy-variant',
  'exceptional'
] as const

// A single screenshot covers all states: the first via the large today icon, the next
// HOURLY_COLUMNS as hourly forecast items, the remaining ones as daily rows. Future daily rows
// always use the day icon, so states with a distinct night variant must sit in the earlier slots.
const HOURLY_COLUMNS = 8 // as many hourly items as fit the default card width
const [todayState, ...forecastStates] = supportedWeatherStates
const hourlyStates = forecastStates.slice(0, HOURLY_COLUMNS)
const dailyStates = forecastStates.slice(HOURLY_COLUMNS)

// The hourly section derives day/night per entry from the sun times: sunrise at local midnight and
// sunset at 23:59:59 (Europe/Berlin) make every hour a day hour — swapped, a night hour.
const DAY_SUN = {
  state: 'above_horizon' as const,
  attributes: { next_rising: '2025-09-15T00:00:00+02:00', next_setting: '2025-09-14T23:59:59+02:00' },
}
const NIGHT_SUN = {
  state: 'below_horizon' as const,
  attributes: { next_rising: '2025-09-14T23:59:59+02:00', next_setting: '2025-09-15T00:00:00+02:00' },
}

for (const animated of ['animated', 'static'] as const) {
  for (const iconVariant of WEATHER_ICON_TYPES) {
    for (const daytime of ['day', 'night'] as const) {
      test(`${animated} ${iconVariant} ${daytime}`, async ({ setupCard, clockWeatherCard }) => {
        const isAnimated = animated === 'animated'
        const isDay = daytime === 'day'
        await setupCard({
          weather: {
            state: todayState,
            forecast_hourly: hourlyForecast(DEFAULT_DATE, hourlyStates, i => ({ temperature: 20 + i })),
            forecast_daily: dailyForecast(DEFAULT_DATE, dailyStates, i => ({ templow: 15 + i, temperature: 25 + i, precipitation_probability: 0 })),
          },
          sun: isDay ? DAY_SUN : NIGHT_SUN,
          cardConfig: `
            weather_icon_type: ${iconVariant}
            animated_icon: ${isAnimated}
            sections:
              hourly_forecast:
                animated_icons: ${isAnimated}
              daily_forecast:
                rows: ${dailyStates.length}
                animated_icons: ${isAnimated}
          `,
          expectedIcons: supportedWeatherStates.length,
        })
        await expect(clockWeatherCard)
          .toHaveScreenshot()
      })
    }
  }
}
