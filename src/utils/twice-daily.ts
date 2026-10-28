import { DateTime } from 'luxon'

import type { WeatherForecast } from '@/types'

type TwiceDailyForecast = WeatherForecast & { is_daytime?: boolean | null }

/** Merges each day/night pair of a twice-daily forecast into one daily entry: high from the day, low from the night. */
export const mergeTwiceDaily = (forecasts: TwiceDailyForecast[]): WeatherForecast[] => {
  const days = new Map<string, { day?: TwiceDailyForecast, night?: TwiceDailyForecast }>()
  for (const forecast of forecasts) {
    // The provider's own offset decides the date, so a night period stays with the day it starts on.
    // Noon keeps that date when shown in any zone within 12h of the provider's, unlike midnight.
    const date = DateTime.fromISO(forecast.datetime, { setZone: true })
      .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
      .toISO()!
    const pair = days.get(date) ?? {}
    pair[forecast.is_daytime === false ? 'night' : 'day'] ??= forecast
    days.set(date, pair)
  }
  return [...days].map(([datetime, { day, night }]) => {
    const merged: TwiceDailyForecast = { ...night, ...day } as TwiceDailyForecast
    delete merged.is_daytime
    const probabilities = [day, night].map(p => p?.precipitation_probability)
      .filter(p => typeof p === 'number')
    return {
      ...merged,
      datetime,
      temperature: (day ?? night)!.temperature,
      templow: day ? night?.temperature : undefined,
      condition: day?.condition ?? night?.condition,
      precipitation_probability: probabilities.length > 0 ? Math.max(...probabilities) : merged.precipitation_probability,
    }
  })
}
