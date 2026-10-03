import type { HomeAssistant } from 'custom-card-helpers'
import { DateTime, type Zone } from 'luxon'

import type { ForecastType, SunEntity, WeatherForecastEvent } from '@/types'
import { WeatherEntityFeature } from '@/types'

const FORECAST_FEATURE_BIT: Record<ForecastType, WeatherEntityFeature> = {
  daily: WeatherEntityFeature.FORECAST_DAILY,
  hourly: WeatherEntityFeature.FORECAST_HOURLY,
  twice_daily: WeatherEntityFeature.FORECAST_TWICE_DAILY,
}

class HassService {

  public isNight(hass: HomeAssistant, sunEntityId: string, at?: DateTime): boolean {
    const sun = hass.states[sunEntityId] as SunEntity | undefined
    if (!sun) return false
    if (at === undefined) return sun.state === 'below_horizon'
    const { sunrise, sunset } = this.getNextSunEvents(hass, sunEntityId, at.zone)
    if (!sunrise || !sunset) return false
    const timeOfDay = (dt: DateTime): number => dt.hour * 3600 + dt.minute * 60 + dt.second
    const atSec = timeOfDay(at)
    return atSec < timeOfDay(sunrise) || atSec >= timeOfDay(sunset)
  }

  public getNextSunEvents(hass: HomeAssistant, sunEntityId: string, zone: Zone | string): { sunrise: DateTime | null, sunset: DateTime | null } {
    const parse = (attribute: string): DateTime | null => {
      const iso = this.getEntityAttributeString(hass, sunEntityId, attribute)
      const dt = iso === null ? null : DateTime.fromISO(iso, { zone })
      return dt?.isValid ? dt : null
    }
    return { sunrise: parse('next_rising'), sunset: parse('next_setting') }
  }

  public getLocale(hass: HomeAssistant): string {
    return hass.language
  }

  public getTimeZone(hass: HomeAssistant): string {
    return hass.config.time_zone
  }

  public getEntityState(hass: HomeAssistant, entityId: string): string | null {
    return hass.states[entityId]?.state ?? null
  }

  public getEntityAttribute(hass: HomeAssistant, entityId: string, attribute: string): unknown {
    return hass.states[entityId]?.attributes[attribute]
  }

  public getEntityAttributeString(hass: HomeAssistant, entityId: string, attribute: string): string | null {
    const attr = this.getEntityAttribute(hass, entityId, attribute)
    return typeof attr === 'string' ? attr : null
  }

  public getEntityUnitOfMeasurement(hass: HomeAssistant, entityId: string): string | null {
    return this.getEntityAttributeString(hass, entityId, 'unit_of_measurement')
  }

  public supportsForecast(hass: HomeAssistant, entityId: string, forecastType: ForecastType): boolean {
    const supported = this.getEntityAttribute(hass, entityId, 'supported_features')
    if (typeof supported !== 'number') return false
    return (supported & FORECAST_FEATURE_BIT[forecastType]) !== 0
  }

  public async subscribeForecast(
    hass: HomeAssistant,
    entityId: string,
    forecastType: ForecastType,
    callback: (event: WeatherForecastEvent) => void,
  ): Promise<() => Promise<void>> {
    const message = {
      type: 'weather/subscribe_forecast',
      forecast_type: forecastType,
      entity_id: entityId
    }
    return hass.connection.subscribeMessage<WeatherForecastEvent>(callback, message, { resubscribe: false })
  }

}
export default new HassService()
