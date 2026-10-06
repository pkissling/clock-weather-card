import { execSync } from 'child_process'
import { rmSync } from 'fs'

import { readHaState } from './ha-state.js'

export default async function globalTeardown(): Promise<void> {
  console.log('[HA Teardown] Stopping Home Assistant container...')

  try {
    const state = readHaState()
    try {
      execSync(`docker rm -f ${state.containerName}`, { stdio: 'ignore' })
    } catch {
      // Container may already be stopped
    }
    rmSync(state.tmpDir, { recursive: true, force: true })
  } catch {
    // State is unset when setup failed before writing it
  }

  console.log('[HA Teardown] Cleanup complete.')
}
