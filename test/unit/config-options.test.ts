import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import * as ts from 'typescript'
import { describe, expect, it } from 'vitest'

const E2E_DIR = resolve(__dirname, '../../e2e')

function collectConfigPaths(): { leaves: string[][], objects: string[][] } {
  const source = ts.createSourceFile(
    'types.ts',
    readFileSync(resolve(__dirname, '../../src/types.ts'), 'utf-8'),
    ts.ScriptTarget.ESNext,
  )
  const root = source.statements.find((node): node is ts.InterfaceDeclaration =>
    ts.isInterfaceDeclaration(node) && node.name.text === 'ClockWeatherCardConfig')
  if (!root) throw new Error('ClockWeatherCardConfig not found in src/types.ts')

  const leaves: string[][] = []
  const objects: string[][] = []
  const walk = (members: ts.NodeArray<ts.TypeElement>, prefix: string[]): void => {
    for (const member of members.filter(ts.isPropertySignature)) {
      const path = [...prefix, (member.name as ts.Identifier).text]
      if (member.type && ts.isTypeLiteralNode(member.type)) {
        objects.push(path)
        walk(member.type.members, path)
      } else {
        leaves.push(path)
      }
    }
  }
  walk(root.members, [])
  return { leaves, objects }
}

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
