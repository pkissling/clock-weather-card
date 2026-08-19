import { execSync } from 'child_process'
import { rmSync } from 'fs'

import { readHaState } from './ha-state.js'

export default async function globalTeardown(): Promise<void> {
  console.log('[HA Teardown] Stopping Home Assistant container...')

  // Only remove this run's own artifacts (identified via the per-run state
  // file) — other sessions may be running concurrently.
  try {
    const state = readHaState()
    try {
      execSync(`docker rm -f ${state.containerName}`, { stdio: 'ignore' })
    } catch {
      // Container may already be stopped
    }
    rmSync(state.tmpDir, { recursive: true, force: true })
  } catch {
    // State file may not exist (setup failed before writing it)
  }

  const stateFile = process.env.HA_E2E_STATE_FILE
  if (stateFile) {
    try {
      rmSync(stateFile, { force: true })
    } catch {
      // Best-effort — unique per-run paths mean a leaked file won't block future runs
    }
  }

  console.log('[HA Teardown] Cleanup complete.')
}
