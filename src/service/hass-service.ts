import type { HomeAssistant } from 'custom-card-helpers'

import type { WeatherForecastEvent } from '@/types'

class HassService {

  public isNight(hass: HomeAssistant, sunEntityId: string): boolean {
    const sun = hass.states[sunEntityId]
    return sun?.state === 'below_horizon'
  }

  public getLocale(hass: HomeAssistant): string {
    return hass.language
  }

  public getTimeZone(hass: HomeAssistant): string {
    return hass.config.time_zone
  }

  public getEntityState(hass: HomeAssistant, entityId: string): string | null {
    // TODO: decide what to do when entityId is missing from hass.states.
    // Currently returns null.
    return hass.states[entityId]?.state ?? null
  }

  public getEntityAttribute(hass: HomeAssistant, entityId: string, attribute: string): unknown {
    // TODO: decide what to do when entityId or attribute is missing.
    // Currently returns undefined.
    return hass.states[entityId]?.attributes[attribute]
  }

  public getEntityUnitOfMeasurement(hass: HomeAssistant, entityId: string): string | null {
    // TODO: decide what to do when unit_of_measurement is missing or non-string.
    // Currently returns null.
    const attr = this.getEntityAttribute(hass, entityId, 'unit_of_measurement')
    return typeof attr === 'string' ? attr : null
  }

  public async subscribeForecast(hass: HomeAssistant, entityId: string, callback: (event: WeatherForecastEvent) => void): Promise<() => Promise<void>> {
    const message = {
      type: 'weather/subscribe_forecast',
      forecast_type: 'daily', // TODO: support hourly and twice_daily forecast types
      entity_id: entityId
    }
    return hass.connection.subscribeMessage<WeatherForecastEvent>(callback, message, { resubscribe: false })
  }

}
export default new HassService()
