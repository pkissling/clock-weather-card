import { type HaState, readHaState } from './ha-state.js'

class HaApi {
  private _state?: HaState

  // Read lazily so importing this module (e.g. during `playwright test --list`) doesn't require globalSetup to have run.
  private get state(): HaState {
    return this._state ??= readHaState()
  }

  private get baseUrl(): string { return this.state.haUrl }
  private get token(): string { return this.state.haToken }

  async setDashboardConfig(urlPath: string, cardConfig: Record<string, unknown>, theme?: string): Promise<void> {
    return this.wsRequest({
      type: 'lovelace/config/save',
      url_path: urlPath,
      config: {
        views: [{
          title: 'Test',
          theme,
          cards: [{ type: 'custom:clock-weather-card', ...cardConfig }],
        }],
      },
    })
  }

  async getCardConfig(urlPath: string): Promise<Record<string, unknown>> {
    const config = await this.wsRequest<{ views: { cards: Record<string, unknown>[] }[] }>({ type: 'lovelace/config', url_path: urlPath })
    return config.views[0].cards[0]
  }

  // Most tests keep the defaults, and each update makes the frontend refetch its config, so unchanged values are skipped.
  private language?: string
  private timeFormat?: string
  private userTimeZone?: string
  private timeZone?: string
  private unitSystem?: string

  // HA stores the user's time format and time zone preferences alongside the language, so all are written together.
  async setLanguage(language: string, timeFormat: string, userTimeZone: 'local' | 'server'): Promise<void> {
    if (language === this.language && timeFormat === this.timeFormat && userTimeZone === this.userTimeZone) return
    await this.wsRequest({
      type: 'frontend/set_user_data',
      key: 'language',
      value: { language, time_format: timeFormat, time_zone: userTimeZone },
    })
    this.language = language
    this.timeFormat = timeFormat
    this.userTimeZone = userTimeZone
  }

  async setTimeZone(timeZone: string): Promise<void> {
    if (timeZone === this.timeZone) return
    await this.wsRequest({
      type: 'config/core/update',
      time_zone: timeZone,
    })
    this.timeZone = timeZone
  }

  async setUnitSystem(unitSystem: 'metric' | 'us_customary'): Promise<void> {
    if (unitSystem === this.unitSystem) return
    await this.wsRequest({
      type: 'config/core/update',
      unit_system: unitSystem,
    })
    this.unitSystem = unitSystem
  }

  async getThemes(): Promise<{ themes: Record<string, unknown> }> {
    return this.wsRequest({ type: 'frontend/get_themes' })
  }

  private wsRequest<T = void>(payload: Record<string, unknown>): Promise<T> {
    const wsUrl = this.baseUrl.replace('http', 'ws') + '/api/websocket'

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl)

      ws.onmessage = (event: MessageEvent) => {
        const msg = JSON.parse(String(event.data))

        if (msg.type === 'auth_required') {
          ws.send(JSON.stringify({ type: 'auth', access_token: this.token }))
        } else if (msg.type === 'auth_ok') {
          ws.send(JSON.stringify({ id: 1, ...payload }))
        } else if (msg.id === 1) {
          ws.close()
          if (msg.success) resolve(msg.result)
          else reject(new Error(`WS request failed: ${JSON.stringify(msg)}`))
        }
      }

      ws.onerror = (err) => reject(err)
    })
  }

  async setEntityState(entityId: string, state: string, attributes: Record<string, unknown> = {}): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/states/${entityId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ state, attributes }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to set state for ${entityId}: ${response.status} ${text}`)
    }
  }

  async removeEntityState(entityId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/states/${entityId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.token}` },
    })

    if (!response.ok && response.status !== 404) {
      const text = await response.text()
      throw new Error(`Failed to remove state of ${entityId}: ${response.status} ${text}`)
    }
  }

  async callService(domain: string, service: string, data: Record<string, unknown> = {}): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to call service ${domain}.${service}: ${response.status} ${text}`)
    }
  }

  async setMockSensor(entityId: string, state: number | string | null, unitOfMeasurement?: string): Promise<void> {
    return this.callService('mock_weather', 'set_sensor', { entity_id: entityId, state, unit_of_measurement: unitOfMeasurement })
  }

  async setDisplayPrecision(entityId: string, precision: number | null): Promise<void> {
    return this.wsRequest({
      type: 'config/entity_registry/update',
      entity_id: entityId,
      options_domain: 'sensor',
      options: { display_precision: precision },
    })
  }

  async setMockWeather(data: Record<string, unknown>): Promise<void> {
    return this.callService('mock_weather', 'set_weather', data)
  }
}

export default new HaApi()
