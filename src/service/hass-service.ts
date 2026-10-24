import type { HomeAssistant } from 'custom-card-helpers'
import { DateTime, type Zone } from 'luxon'

import logger from '@/service/logger'
import type { ForecastType, RenderTemplateEvent, SunEntity, TemperatureUnit, WeatherForecastEvent } from '@/types'
import { WeatherEntityFeature } from '@/types'
import { convertTemperature, isTemperatureUnit, toDisplayTemperature } from '@/utils/temperature'

const FORECAST_FEATURE_BIT: Record<ForecastType, WeatherEntityFeature> = {
  daily: WeatherEntityFeature.FORECAST_DAILY,
  hourly: WeatherEntityFeature.FORECAST_HOURLY,
  twice_daily: WeatherEntityFeature.FORECAST_TWICE_DAILY,
}

type UnitSource = { attribute: string } | { fixed: string }

// custom-card-helpers' HomeAssistant predates the entity registry display entries.
type HassEntities = { entities?: Record<string, { display_precision?: number } | undefined> }

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
    // Shifts an event by whole days to its last occurrence at or before `at`, so a sunset after midnight still counts.
    const lastBefore = (event: DateTime): DateTime => event.minus({ days: Math.ceil(event.diff(at, 'days').days) })
    return lastBefore(sunset) > lastBefore(sunrise)
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

  public isRtl(hass: HomeAssistant, locale: string): boolean {
    const translations = hass.translationMetadata?.translations ?? {}
    const { baseName, language } = new Intl.Locale(locale)
    return (translations[baseName] ?? translations[language])?.isRTL ?? false
  }

  // Luxon's localized tokens (e.g. `t`) follow the locale's hour cycle, so HA's 12/24h profile setting is applied as a Unicode extension.
  public withHourCycle(hass: HomeAssistant, locale: string): string {
    const timeFormat: string | undefined = hass.locale?.time_format
    const hourCycle = timeFormat === '12' ? 'h12'
      : timeFormat === '24' ? 'h23'
        : timeFormat === 'system' ? new Intl.DateTimeFormat(undefined, { hour: 'numeric' })
          .resolvedOptions().hour12 ? 'h12' : 'h23'
          : undefined
    return hourCycle && !locale.includes('-u-') ? `${locale}-u-hc-${hourCycle}` : locale
  }

  public getNumberFormat(hass: HomeAssistant): string {
    return hass.locale?.number_format ?? 'language'
  }

  public getTimeZone(hass: HomeAssistant): string {
    return (hass.locale as { time_zone?: string } | undefined)?.time_zone === 'local'
      ? Intl.DateTimeFormat()
        .resolvedOptions().timeZone
      : hass.config.time_zone
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

  public getCurrentTemperature(hass: HomeAssistant, weatherEntityId: string, sensorId: string | null, toUnit: TemperatureUnit): number | null {
    return sensorId === null
      ? this.getWeatherTemperature(hass, weatherEntityId, 'temperature', toUnit)
      : this.getSensorTemperature(hass, sensorId, toUnit)
  }

  public getSensorTemperature(hass: HomeAssistant, sensorId: string | null, toUnit: TemperatureUnit): number | null {
    if (sensorId === null) return null
    const temperature = toDisplayTemperature(this.getEntityState(hass, sensorId), this.getEntityUnitOfMeasurement(hass, sensorId), toUnit)
    // Sensor states carry their raw precision, unlike weather entities.
    if (temperature === null) return null
    const precision = this.getDisplayPrecision(hass, sensorId) ?? 1
    return Number(temperature.toFixed(precision))
  }

  public getDisplayPrecision(hass: HomeAssistant, entityId: string): number | null {
    return (hass as HomeAssistant & HassEntities).entities?.[entityId]?.display_precision ?? null
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

  public async subscribeTemplate(
    hass: HomeAssistant,
    template: string,
    callback: (event: RenderTemplateEvent) => void,
  ): Promise<() => Promise<void>> {
    return hass.connection.subscribeMessage<RenderTemplateEvent>(callback, { type: 'render_template', template, report_errors: true })
  }

}
export default new HassService()
