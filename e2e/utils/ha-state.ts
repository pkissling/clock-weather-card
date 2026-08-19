import { randomBytes } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'

const ENV_VAR = 'HA_E2E_STATE_FILE'

// The single global name shared by every disposable artifact a run creates
// (containers, Docker labels, state files, tmp config dirs — the snapshot
// helper's image tag repeats it in shell) so stale leftovers can be
// identified safely.
export const E2E_ARTIFACT_NAME = 'clock-weather-card-e2e'

const E2E_ARTIFACT_PREFIX = `${E2E_ARTIFACT_NAME}-`

// Artifacts older than this are considered leftovers of a crashed run and safe
// to remove — comfortably above the CI job timeout (45m), so a concurrently
// running session's artifacts are never touched.
export const STALE_AFTER_MS = 6 * 60 * 60 * 1000

export interface HaState {
  haUrl: string
  haToken: string
  tmpDir: string
  containerName: string
}

export function createStateFilePath(): string {
  const stateFile = path.join(os.tmpdir(), `${E2E_ARTIFACT_PREFIX}state-${randomBytes(8)
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

export function writeHaState(state: HaState): void {
  writeFileSync(getStateFilePath(), JSON.stringify(state))
}

export function readHaState(): HaState {
  return JSON.parse(readFileSync(getStateFilePath(), 'utf-8')) as HaState
}

// The process id is unique among live sessions, so concurrent runs never
// clash on (or kill) each other's container. A recycled pid could collide
// with a crashed run's leftover container, but with pid_max in the millions
// that is negligible — and `docker run` fails loudly if it ever happens.
export function createContainerName(): string {
  return `${E2E_ARTIFACT_PREFIX}${process.pid}`
}

export function isStaleHaTempEntry(name: string, mtimeMs: number, nowMs: number): boolean {
  return name.startsWith(E2E_ARTIFACT_PREFIX) && nowMs - mtimeMs > STALE_AFTER_MS
}

export function isStaleCreatedAt(createdIso: string, nowMs: number): boolean {
  const createdMs = Date.parse(createdIso)
  if (Number.isNaN(createdMs)) return false
  return nowMs - createdMs > STALE_AFTER_MS
}
