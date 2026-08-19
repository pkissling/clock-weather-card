import { expect, test } from '../utils/fixtures'
import { dailyForecast, DEFAULT_DATE } from '../utils/test-utils'

const DAYS = [
  { condition: 'sunny', templow: 5, temperature: 15 },
  { condition: 'partlycloudy', templow: -10, temperature: 30 },
  { condition: 'cloudy', templow: 0, temperature: 10 },
  { condition: 'rainy', templow: 10, temperature: 25 },
  { condition: 'sunny', templow: 18, temperature: 22 },
]
const DAILY = dailyForecast(DEFAULT_DATE, DAYS.map(d => d.condition), i => ({ ...DAYS[i], precipitation_probability: 0 }))

test('default gradient', async ({ setupCard, clockWeatherCard }) => {
  await setupCard({
    cardConfig: `
      sections:
        hourly_forecast:
          hide: true
    `,
    weather: { forecast_daily: DAILY },
  })
  await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
    .toHaveScreenshot()
})

test('custom gradient', async ({ setupCard, clockWeatherCard }) => {
  await setupCard({
    cardConfig: `
      sections:
        hourly_forecast:
          hide: true
        daily_forecast:
          gradient:
            0: "#ff00ff"
            30: "#00ff00"
    `,
    weather: { forecast_daily: DAILY },
  })
  await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
    .toHaveScreenshot()
})

test('gradient narrower than the bar range', async ({ setupCard, clockWeatherCard }) => {
  await setupCard({
    cardConfig: `
      sections:
        hourly_forecast:
          hide: true
        daily_forecast:
          gradient:
            5: "#ff0000"
            15: "#0000ff"
    `,
    weather: { forecast_daily: DAILY },
  })
  await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
    .toHaveScreenshot()
})

test('single stop gradient', async ({ setupCard, clockWeatherCard }) => {
  await setupCard({
    cardConfig: `
      sections:
        hourly_forecast:
          hide: true
        daily_forecast:
          gradient:
            10: "#3366ff"
    `,
    weather: { forecast_daily: DAILY },
  })
  await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
    .toHaveScreenshot()
})
