import { createHash } from 'crypto'

export const E2E_ARTIFACT_NAME = 'clock-weather-card-e2e'

export interface HaState {
  haUrl: string
  haToken: string
  tmpDir: string
  containerName: string
}

const ENV_VARS: Record<keyof HaState, string> = {
  haUrl: 'E2E_HA_URL',
  haToken: 'E2E_HA_TOKEN',
  tmpDir: 'E2E_HA_TMP_DIR',
  containerName: 'E2E_HA_CONTAINER_NAME',
}

// Playwright hands env vars set in globalSetup to the workers and to globalTeardown.
export function writeHaState(state: HaState): void {
  for (const key of Object.keys(ENV_VARS) as (keyof HaState)[]) {
    process.env[ENV_VARS[key]] = state[key]
  }
}

export function readHaState(): HaState {
  const read = (key: keyof HaState): string => {
    const value = process.env[ENV_VARS[key]]
    if (!value) throw new Error(`${ENV_VARS[key]} is not set — globalSetup must run before tests read HA state`)
    return value
  }
  return { haUrl: read('haUrl'), haToken: read('haToken'), tmpDir: read('tmpDir'), containerName: read('containerName') }
}

// Derived from the host worktree path (as is the runner's in run-in-docker.sh) so a worktree can only run one e2e session at a time.
export function createContainerName(projectDir: string): string {
  return `${E2E_ARTIFACT_NAME}-${createHash('sha256')
    .update(projectDir)
    .digest('hex')
    .slice(0, 12)}-ha`
}
