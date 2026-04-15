import { randomBytes } from 'crypto'
import os from 'os'
import path from 'path'

const ENV_VAR = 'HA_E2E_STATE_FILE'

export function createStateFilePath(): string {
  const stateFile = path.join(os.tmpdir(), `ha-e2e-state-${randomBytes(8)
    .toString('hex')}.json`)
  process.env[ENV_VAR] = stateFile
  return stateFile
}

export function getStateFilePath(): string {
  const stateFile = process.env[ENV_VAR]
  if (!stateFile) {
    throw new Error(`${ENV_VAR} is not set — globalSetup must run before tests read HA state`)
  }
  return stateFile
}
