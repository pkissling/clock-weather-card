import { readFileSync } from 'fs'
import os from 'os'
import path from 'path'

const STATE_FILE = path.join(os.tmpdir(), 'ha-e2e-state.json')

interface HAState {
  haUrl: string
  haToken: string
  tmpDir: string
}

export class HAApi {
  private baseUrl: string
  private token: string

  constructor() {
    const state: HAState = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
    this.baseUrl = state.haUrl
    this.token = state.haToken
  }

  async setDashboardConfig(urlPath: string, cardConfig: Record<string, unknown>): Promise<void> {
    const wsUrl = this.baseUrl.replace('http', 'ws') + '/api/websocket'

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl)

      ws.onmessage = (event: MessageEvent) => {
        const msg = JSON.parse(String(event.data))

        if (msg.type === 'auth_required') {
          ws.send(JSON.stringify({ type: 'auth', access_token: this.token }))
        } else if (msg.type === 'auth_ok') {
          ws.send(JSON.stringify({
            id: 1,
            type: 'lovelace/config/save',
            url_path: urlPath,
            config: {
              views: [{
                title: 'Test',
                cards: [{ type: 'custom:clock-weather-card', ...cardConfig }],
              }],
            },
          }))
        } else if (msg.id === 1) {
          ws.close()
          if (msg.success) resolve()
          else reject(new Error(`Lovelace config save failed: ${JSON.stringify(msg)}`))
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
