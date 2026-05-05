import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import * as ts from 'typescript'
import { describe, expect, it } from 'vitest'

function getConfigOptionNames(): string[] {
  const path = resolve(__dirname, '../../src/types.ts')
  const sf = ts.createSourceFile(
    'types.ts',
    readFileSync(path, 'utf-8'),
    ts.ScriptTarget.ESNext,
    true
  )

  let names: string[] = []
  sf.forEachChild(node => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === 'ClockWeatherCardConfig') {
      names = node.members
        .filter(ts.isPropertySignature)
        .map(m => (m.name as ts.Identifier).text)
    }
  })

  if (!names.length) throw new Error('ClockWeatherCardConfig not found in src/types.ts')
  return names
}

describe('every ClockWeatherCardConfig option has a dedicated e2e test fixture', () => {
  for (const name of getConfigOptionNames()) {
    const folder = name.replace(/_/g, '-')
    it(`e2e/config-options/${folder}/${folder}.spec.ts exists`, () => {
      const spec = resolve(__dirname, `../../e2e/config-options/${folder}/${folder}.spec.ts`)
      expect(existsSync(spec), `Missing ${spec}`)
        .toBe(true)
    })
  }
})

// Each config-options spec must include a "(no reload)" test asserting that the
// card reacts to runtime config / state changes without a page refresh.
describe('every config-options spec has a runtime-update (no reload) test', () => {
  for (const name of getConfigOptionNames()) {
    const folder = name.replace(/_/g, '-')
    it(`${folder}.spec.ts contains a "(no reload)" test`, () => {
      const spec = resolve(__dirname, `../../e2e/config-options/${folder}/${folder}.spec.ts`)
      const content = readFileSync(spec, 'utf-8')
      expect(content, `Missing "(no reload)" test in ${spec}`)
        .toMatch(/\(no reload\)/)
    })
  }
})
