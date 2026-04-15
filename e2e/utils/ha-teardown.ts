import { execSync } from 'child_process'
import { readFileSync, rmSync } from 'fs'

const HA_CONTAINER_NAME = 'ha-e2e-test'

export default async function globalTeardown(): Promise<void> {
  console.log('[HA Teardown] Stopping Home Assistant container...')
  try {
    execSync(`docker rm -f ${HA_CONTAINER_NAME}`, { stdio: 'ignore' })
  } catch {
    // Container may already be stopped
  }

  // Clean up temp directory and state file
  const stateFile = process.env.HA_E2E_STATE_FILE
  if (stateFile) {
    try {
      const state = JSON.parse(readFileSync(stateFile, 'utf-8'))
      if (state.tmpDir) {
        rmSync(state.tmpDir, { recursive: true, force: true })
      }
    } catch {
      // State file may not exist (setup failed before writing it)
    }
    try {
      rmSync(stateFile, { force: true })
    } catch {
      // Best-effort — unique per-run paths mean a leaked file won't block future runs
    }
  }

  console.log('[HA Teardown] Cleanup complete.')
}
