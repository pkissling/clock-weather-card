import { readFileSync } from 'fs'

import { getStateFilePath } from './ha-state.js'

interface HaState {
  haUrl: string
  haToken: string
  tmpDir: string
}

class HaApi {
  private _state?: HaState

  // Read lazily so importing this module (e.g. during `playwright test --list`)
  // doesn't require globalSetup to have already written the state file.
  private get state(): HaState {
    return this._state ??= JSON.parse(readFileSync(getStateFilePath(), 'utf-8')) as HaState
  }

  private get baseUrl(): string { return this.state.haUrl }
  private get token(): string { return this.state.haToken }

  async setDashboardConfig(urlPath: string, cardConfig: Record<string, unknown>): Promise<void> {
    return this.wsRequest({
      type: 'lovelace/config/save',
      url_path: urlPath,
      config: {
        views: [{
          title: 'Test',
          cards: [{ type: 'custom:clock-weather-card', ...cardConfig }],
        }],
      },
    })
  }

  async setLanguage(language: string): Promise<void> {
    return this.wsRequest({
      type: 'frontend/set_user_data',
      key: 'language',
      value: { language },
    })
  }

  async setTimeZone(timeZone: string): Promise<void> {
    return this.wsRequest({
      type: 'config/core/update',
      time_zone: timeZone,
    })
  }

  private wsRequest(payload: Record<string, unknown>): Promise<void> {
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
          if (msg.success) resolve()
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
}

export default new HaApi()
