import { WEATHER_ICON_TYPES } from '../../src/types'
import { expect, test } from '../utils/fixtures'
import { DEFAULT_DATE, hourlyForecast } from '../utils/test-utils'

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

// Each screenshot covers one group: the first state via the large today icon, the rest as
// hourly forecast items (up to 7 fit the default card width).
const STATES_PER_SCREENSHOT = 8
const stateGroups: string[][] = []
for (let i = 0; i < supportedWeatherStates.length; i += STATES_PER_SCREENSHOT) {
  stateGroups.push(supportedWeatherStates.slice(i, i + STATES_PER_SCREENSHOT))
}

// The strip derives day/night per hour from the sun times: sunrise at local midnight and
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
      for (const [groupIndex, states] of stateGroups.entries()) {
        test(`${animated} ${iconVariant} ${daytime} ${groupIndex + 1}`, async ({ setupCard, clockWeatherCard }) => {
          const isAnimated = animated === 'animated'
          const isDay = daytime === 'day'
          const [todayState, ...forecastStates] = states
          await setupCard({
            weather: {
              state: todayState,
              forecast_hourly: hourlyForecast(DEFAULT_DATE, forecastStates, () => ({ temperature: 20 })),
            },
            sun: isDay ? DAY_SUN : NIGHT_SUN,
            cardConfig: `
              weather_icon_type: ${iconVariant}
              animated_icon: ${isAnimated}
              sections:
                hourly_forecast:
                  animated_icons: ${isAnimated}
            `,
            expectedIcons: states.length,
          })
          await expect(clockWeatherCard)
            .toHaveScreenshot()
        })
      }
    }
  }
}
