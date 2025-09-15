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
    const sun = states[sunEntityId]
    return sun?.state === 'below_horizon'
  }

}
export default new HassService()
