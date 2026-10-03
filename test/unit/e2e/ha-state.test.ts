import { execSync } from 'child_process'
import { describe, expect, it } from 'vitest'

import { createContainerName } from '../../../e2e/utils/ha-state'

describe('createContainerName', () => {
  it('returns the same name for the same worktree', () => {
    expect(createContainerName('/work/a'))
      .toBe(createContainerName('/work/a'))
  })

  it('returns different names for different worktrees', () => {
    expect(createContainerName('/work/a')).not.toBe(createContainerName('/work/b'))
  })

  it('prefixes the name with the e2e artifact name', () => {
    expect(createContainerName('/work/a'))
      .toMatch(/^clock-weather-card-e2e-[0-9a-f]{12}-ha$/)
  })

  it('uses the same worktree hash as the runner container in run-in-docker.sh', () => {
    const shellHash = execSync('printf \'%s\' /work/a | shasum -a 256 | cut -c1-12', { encoding: 'utf-8' })
      .trim()
    expect(createContainerName('/work/a'))
      .toBe(`clock-weather-card-e2e-${shellHash}-ha`)
  })
})
