import { execSync } from 'child_process'
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

import { createStateFilePath } from './ha-state.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const HA_PORT = 8123
const HA_CONTAINER_NAME = 'ha-e2e-test'
const HA_IMAGE = 'ghcr.io/home-assistant/home-assistant:stable'
const HA_CONFIG_DIR = path.join(__dirname, 'ha-config')
const DIST_DIR = path.join(__dirname, '..', '..', 'dist')

export const TEST_DASHBOARD = 'clock-weather-card'

export default async function globalSetup(): Promise<void> {
  console.log('[HA Setup] Building card...')
  execSync('yarn build', { cwd: path.join(__dirname, '..', '..'), stdio: 'inherit' })

  console.log('[HA Setup] Preparing HA config directory...')
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'ha-e2e-'))

  // Copy HA config fixtures (configuration.yaml + custom_components)
  cpSync(HA_CONFIG_DIR, tmpDir, { recursive: true })

  // Generate .storage files for dashboards and resources
  generateStorageFiles(tmpDir)

  // Copy built card assets into www/
  const wwwDir = path.join(tmpDir, 'www')
  mkdirSync(wwwDir, { recursive: true })
  cpSync(DIST_DIR, wwwDir, { recursive: true })

  // Stop any existing container
  try {
    execSync(`docker rm -f ${HA_CONTAINER_NAME}`, { stdio: 'ignore' })
  } catch {
    // Container didn't exist, that's fine
  }

  console.log('[HA Setup] Starting Home Assistant container...')
  execSync(
    `docker run -d --name ${HA_CONTAINER_NAME} ` +
    `-p ${HA_PORT}:8123 ` +
    `-v ${tmpDir}:/config ` +
    '-e TZ=UTC ' +
    `${HA_IMAGE}`,
    { stdio: 'inherit' },
  )

  console.log('[HA Setup] Waiting for Home Assistant to start...')
  await waitForHA(`http://127.0.0.1:${HA_PORT}`)

  console.log('[HA Setup] Completing onboarding...')
  const token = await completeOnboarding(`http://127.0.0.1:${HA_PORT}`)

  // Unique path per run — a stale file owned by a different user (e.g. root in
  // Docker vs. host user) can't block this write.
  const stateFile = createStateFilePath()
  const state = {
    haUrl: `http://127.0.0.1:${HA_PORT}`,
    haToken: token,
    tmpDir,
  }
  writeFileSync(stateFile, JSON.stringify(state))

  console.log('[HA Setup] Home Assistant is ready!')
}

function generateStorageFiles(configDir: string): void {
  const storageDir = path.join(configDir, '.storage')
  mkdirSync(storageDir, { recursive: true })

  // Lovelace resources — register the card JS
  writeStorageFile(storageDir, 'lovelace_resources', {
    items: [
      {
        id: 'clock_weather_card',
        type: 'module',
        url: '/local/clock-weather-card.js',
      },
    ],
  })

  // Lovelace dashboard — register a single test dashboard (config is updated per-test via REST API)
  writeStorageFile(storageDir, 'lovelace_dashboards', {
    items: [
      {
        id: TEST_DASHBOARD,
        icon: 'mdi:test-tube',
        title: 'Test',
        url_path: TEST_DASHBOARD,
        require_admin: false,
        show_in_sidebar: true,
        mode: 'storage',
      },
    ],
  })

  // Seed the dashboard with an initial config so the REST API endpoint is available
  writeStorageFile(storageDir, `lovelace.${TEST_DASHBOARD}`, {
    config: {
      views: [{ title: 'Test', cards: [] }],
    },
  })
}

function writeStorageFile(storageDir: string, key: string, data: unknown): void {
  writeFileSync(
    path.join(storageDir, key),
    JSON.stringify({
      version: 1,
      minor_version: 1,
      key,
      data,
    }, null, 2) + '\n',
  )
}

async function waitForHA(baseUrl: string, timeoutMs = 120_000): Promise<void> {
  const start = Date.now()
  const interval = 2_000

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/onboarding`)
      // Any HTTP response means HA is up
      if (response.status > 0) return
    } catch {
      // Not ready yet (connection refused)
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`Home Assistant did not start within ${timeoutMs / 1000}s`)
}

async function completeOnboarding(baseUrl: string): Promise<string> {
  const clientId = `${baseUrl}/`

  // Step 1: Create user
  const userRes = await fetch(`${baseUrl}/api/onboarding/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      name: 'Test',
      username: 'test',
      password: 'test1234',
      language: 'en',
    }),
  })

  if (!userRes.ok) {
    const text = await userRes.text()
    throw new Error(`Onboarding user creation failed: ${userRes.status} ${text}`)
  }

  const { auth_code } = await userRes.json() as { auth_code: string }

  // Step 2: Exchange auth code for token
  const tokenRes = await fetch(`${baseUrl}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: auth_code,
      client_id: clientId,
    }),
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    throw new Error(`Token exchange failed: ${tokenRes.status} ${text}`)
  }

  const { access_token } = await tokenRes.json() as { access_token: string }

  // Step 3: Complete remaining onboarding steps
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${access_token}`,
  }

  await fetch(`${baseUrl}/api/onboarding/core_config`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })

  await fetch(`${baseUrl}/api/onboarding/analytics`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })

  await fetch(`${baseUrl}/api/onboarding/integration`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ client_id: clientId, redirect_uri: `${baseUrl}/auth/authorize` }),
  })

  return access_token
}
