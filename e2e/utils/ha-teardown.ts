import { execSync } from 'child_process'
import { readFileSync, rmSync } from 'fs'
import os from 'os'
import path from 'path'

const HA_CONTAINER_NAME = 'ha-e2e-test'
const STATE_FILE = path.join(os.tmpdir(), 'ha-e2e-state.json')

export default async function globalTeardown(): Promise<void> {
  console.log('[HA Teardown] Stopping Home Assistant container...')
  try {
    execSync(`docker rm -f ${HA_CONTAINER_NAME}`, { stdio: 'ignore' })
  } catch {
    // Container may already be stopped
  }

  // Clean up temp directory
  try {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
    if (state.tmpDir) {
      rmSync(state.tmpDir, { recursive: true, force: true })
    }
    rmSync(STATE_FILE, { force: true })
  } catch {
    // State file may not exist
  }

  console.log('[HA Teardown] Cleanup complete.')
}
