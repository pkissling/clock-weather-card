import { WEATHER_ICON_TYPES } from '../../src/types'
import { expect, test } from '../utils/fixtures'
import { dailyForecast, DEFAULT_DATE, hourlyForecast } from '../utils/test-utils'

export const supportedWeatherStates = [
  'rainy',
  'partlycloudy',
  'cloudy',
  'clear-night',
  'fog',
  'hail',
  'lightning',
  'lightning-rainy',
  'pouring',
  'snowy',
  'snowy-rainy',
  'sunny',
  'windy',
  'windy-variant',
  'exceptional'
] as const

// A single screenshot covers all states: the first via the large today icon, the next
// HOURLY_COLUMNS as hourly forecast items, the remaining ones as daily rows.
const HOURLY_COLUMNS = 8 // as many hourly items as fit the default card width
const [todayState, ...forecastStates] = supportedWeatherStates
const hourlyStates = forecastStates.slice(0, HOURLY_COLUMNS)
const dailyStates = forecastStates.slice(HOURLY_COLUMNS)

// The sections derive day/night per entry from the sun times: sunrise at local midnight and
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
            forecast_hourly: hourlyForecast(DEFAULT_DATE, hourlyStates, () => ({ temperature: 20 })),
            forecast_daily: dailyForecast(DEFAULT_DATE, dailyStates, () => ({ templow: 15, temperature: 25, precipitation_probability: 0 })),
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
