import type { HomeAssistant } from 'custom-card-helpers'

class HassService {

  public getWeatherState(states: HomeAssistant['states'], weatherEntityId: string): string {
    const entity = states[weatherEntityId]
    if (!entity) {
      throw new Error(`Entity ${weatherEntityId} not found`)
    }
    return entity.state
  }

  public isNight(states: HomeAssistant['states'], sunEntityId: string): boolean {
    // TODO throw error if not found?
    const sun = states[sunEntityId]
    return sun?.state === 'below_horizon'
  }

  public getLocale(hass: HomeAssistant): string {
    // TODO throw error if not found?
    return hass.locale?.language ?? hass.language ?? 'en'
  }

  public getEntityState(states: HomeAssistant['states'], entityId: string): string | undefined {
    // TODO throw error if not found?
    return states[entityId]?.state
  }

  public getEntityAttribute(states: HomeAssistant['states'], entityId: string, attribute: string): unknown {
    // TODO throw error if not found?
    return states[entityId]?.attributes[attribute]
  }

  public getEntityUnitOfMeasurement(states: HomeAssistant['states'], entityId: string): string {
    // TODO throw error if not found?
    return (states[entityId]?.attributes.unit_of_measurement as string) ?? ''
  }

}
export default new HassService()
