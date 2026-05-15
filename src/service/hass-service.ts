import type { HomeAssistant } from 'custom-card-helpers'
import { DateTime } from 'luxon'

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
    return this.isNightAt(sun, at)
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

  private isNightAt(sun: SunEntity, at: DateTime): boolean {
    const rising = sun.attributes.next_rising
    const setting = sun.attributes.next_setting
    if (typeof rising !== 'string' || typeof setting !== 'string') {
      return false
    }
    const nextRising = DateTime.fromISO(rising, { zone: at.zone })
    const nextSetting = DateTime.fromISO(setting, { zone: at.zone })
    if (!nextRising.isValid || !nextSetting.isValid) {
      return false
    }
    const timeOfDay = (dt: DateTime): number => dt.hour * 3600 + dt.minute * 60 + dt.second
    const atSec = timeOfDay(at)
    return atSec < timeOfDay(nextRising) || atSec >= timeOfDay(nextSetting)
  }

}
export default new HassService()
