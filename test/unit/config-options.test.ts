import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

import { collectConfigPaths } from './config-paths'

const E2E_DIR = resolve(__dirname, '../../e2e')

const { leaves, objects } = collectConfigPaths()
const toSpecPath = (path: string[]): string => path.join('/')
  .replace(/_/g, '-')

describe('every config leaf has an e2e config-options spec with a (no reload) test', () => {
  for (const path of leaves) {
    const name = toSpecPath(path)
    const spec = `config-options/${path.length === 1 ? `${name}/${name}` : name}.spec.ts`
    it(`${path.join('.')} → ${spec}`, () => {
      const file = resolve(E2E_DIR, spec)
      expect(existsSync(file), `Missing e2e/${spec}`)
        .toBe(true)
      expect(readFileSync(file, 'utf-8'), `Missing "(no reload)" test in e2e/${spec}`)
        .toMatch(/\(no reload\)/)
    })
  }
})

describe('every config object has a section-level e2e spec', () => {
  for (const path of objects) {
    const spec = `${toSpecPath(path)}.spec.ts`
    it(`${path.join('.')} → ${spec}`, () => {
      expect(existsSync(resolve(E2E_DIR, spec)), `Missing e2e/${spec}`)
        .toBe(true)
    })
  }
})
