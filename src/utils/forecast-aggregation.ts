import { DateTime } from 'luxon'

import type { WeatherForecast } from '@/types'

type AggregatableForecast = WeatherForecast & { is_daytime?: boolean | null, precipitation?: number | null }

const numbers = (values: unknown[]): number[] => values.filter(v => typeof v === 'number')

const mostFrequent = (values: string[]): string | undefined => {
  const counts = new Map<string, number>()
  values.forEach(v => counts.set(v, (counts.get(v) ?? 0) + 1))
  // Ties go to the earliest value, as Map keeps insertion order.
  return [...counts].reduce<[string, number] | undefined>((best, entry) => !best || entry[1] > best[1] ? entry : best, undefined)?.[0]
}

/** Merges the entries of each day into one daily entry: high/low across the day, the most frequent daytime condition, the highest precipitation probability and the summed precipitation. */
const aggregateDaily = (forecasts: AggregatableForecast[], dayOf: (datetime: string) => DateTime): WeatherForecast[] => {
  const days = new Map<string, AggregatableForecast[]>()
  for (const forecast of forecasts) {
    const date = dayOf(forecast.datetime)
      .startOf('day')
      .toISO()!
    days.set(date, [...days.get(date) ?? [], forecast])
  }
  return [...days].map(([datetime, entries]) => {
    const daytime = entries.filter(e => e.is_daytime !== false)
    // Attributes without an aggregation rule come from the first daytime entry, else from the first entry.
    const merged: AggregatableForecast = Object.assign({}, ...[...entries].reverse(), ...[...daytime].reverse())
    delete merged.is_daytime
    const temperatures = numbers(entries.map(e => e.temperature))
    const lows = numbers(entries.map(e => e.templow ?? e.temperature))
    const probabilities = numbers(entries.map(e => e.precipitation_probability))
    const precipitations = numbers(entries.map(e => e.precipitation))
    const conditions = (entries: AggregatableForecast[]): string[] => entries.map(e => e.condition)
      .filter(c => typeof c === 'string')
    return {
      ...merged,
      datetime,
      temperature: temperatures.length > 0 ? Math.max(...temperatures) : merged.temperature,
      // A single entry gives no low, e.g. a lone night period.
      templow: entries.length > 1 && lows.length > 0 ? Math.min(...lows) : undefined,
      condition: mostFrequent(conditions(daytime)) ?? mostFrequent(conditions(entries)) ?? merged.condition,
      precipitation_probability: probabilities.length > 0 ? Math.max(...probabilities) : merged.precipitation_probability,
      ...precipitations.length > 0 && { precipitation: precipitations.reduce((a, b) => a + b) },
    }
  })
}

/** Merges each day/night pair of a twice-daily forecast into one daily entry. */
export const mergeTwiceDaily = (forecasts: AggregatableForecast[]): WeatherForecast[] =>
  // The provider's own offset decides the date, so a night period stays with the day it starts on.
  aggregateDaily(forecasts, datetime => DateTime.fromISO(datetime, { setZone: true }))

/** Merges the hours of each day in `timeZone` into one daily entry. */
export const mergeHourly = (forecasts: AggregatableForecast[], timeZone: string): WeatherForecast[] =>
  aggregateDaily(forecasts, datetime => DateTime.fromISO(datetime, { zone: timeZone }))
