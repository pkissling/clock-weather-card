import type { HomeAssistant } from 'custom-card-helpers'
import { DateTime, type Zone } from 'luxon'

import logger from '@/service/logger'
import type { ForecastType, SunEntity, TemperatureUnit, WeatherForecastEvent } from '@/types'
import { WeatherEntityFeature } from '@/types'
import { convertTemperature, isTemperatureUnit } from '@/utils/temperature'

const FORECAST_FEATURE_BIT: Record<ForecastType, WeatherEntityFeature> = {
  daily: WeatherEntityFeature.FORECAST_DAILY,
  hourly: WeatherEntityFeature.FORECAST_HOURLY,
  twice_daily: WeatherEntityFeature.FORECAST_TWICE_DAILY,
}

type UnitSource = { attribute: string } | { fixed: string }

const WEATHER_ATTRIBUTE_UNITS: Record<string, UnitSource> = {
  temperature: { attribute: 'temperature_unit' },
  apparent_temperature: { attribute: 'temperature_unit' },
  dew_point: { attribute: 'temperature_unit' },
  pressure: { attribute: 'pressure_unit' },
  wind_speed: { attribute: 'wind_speed_unit' },
  wind_gust_speed: { attribute: 'wind_speed_unit' },
  visibility: { attribute: 'visibility_unit' },
  precipitation: { attribute: 'precipitation_unit' },
  precipitation_probability: { fixed: '%' },
  humidity: { fixed: '%' },
  cloud_coverage: { fixed: '%' },
  wind_bearing: { fixed: '°' },
}

class HassService {

  public isNight(hass: HomeAssistant, sunEntityId: string, at?: DateTime): boolean {
    const sun = hass.states[sunEntityId] as SunEntity | undefined
    if (!sun) {
      logger.warn(`Sun entity "${sunEntityId}" not found, assuming daytime`)
      return false
    }
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
      if (dt?.isValid) return dt
      logger.warn(`Sun entity "${sunEntityId}" has a missing or invalid ${attribute} "${iso}"`)
      return null
    }
    return { sunrise: parse('next_rising'), sunset: parse('next_setting') }
  }

  public getLocale(hass: HomeAssistant): string {
    return hass.language
  }

  public getTimeZone(hass: HomeAssistant): string {
    return hass.config.time_zone
  }

  public getTemperatureUnit(hass: HomeAssistant): TemperatureUnit {
    const unit = hass.config.unit_system?.temperature
    return isTemperatureUnit(unit) ? unit : '°C'
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

  public isWeatherTemperatureAttribute(attribute: string): boolean {
    const known = WEATHER_ATTRIBUTE_UNITS[attribute]
    return known !== undefined && 'attribute' in known && known.attribute === 'temperature_unit'
  }

  public getWeatherTemperature(hass: HomeAssistant, entityId: string, attribute: string, toUnit: TemperatureUnit): number | null {
    const value = this.getEntityAttribute(hass, entityId, attribute)
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    return convertTemperature(value, this.getEntityAttributeString(hass, entityId, 'temperature_unit'), toUnit)
  }

  public getEntityUnitOfMeasurement(hass: HomeAssistant, entityId: string): string | null {
    return this.getEntityAttributeString(hass, entityId, 'unit_of_measurement')
  }

  public getWeatherAttributeUnit(hass: HomeAssistant, entityId: string, attribute: string): string | null {
    const known = WEATHER_ATTRIBUTE_UNITS[attribute]
    if (known && 'fixed' in known && typeof this.getEntityAttribute(hass, entityId, attribute) !== 'number') return null
    return this.getForecastAttributeUnit(hass, entityId, attribute)
  }

  public getForecastAttributeUnit(hass: HomeAssistant, entityId: string, attribute: string): string | null {
    const known = WEATHER_ATTRIBUTE_UNITS[attribute]
    if (known && 'fixed' in known) return known.fixed
    return this.getEntityAttributeString(hass, entityId, known?.attribute ?? `${attribute}_unit`)
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
