import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import * as ts from 'typescript'
import { describe, expect, it } from 'vitest'

type LeafPath = string[]

function getConfigOptionPaths(): LeafPath[] {
  const path = resolve(__dirname, '../../src/types.ts')
  const sf = ts.createSourceFile(
    'types.ts',
    readFileSync(path, 'utf-8'),
    ts.ScriptTarget.ESNext,
    true
  )

  const interfaces = new Map<string, ts.InterfaceDeclaration>()
  sf.forEachChild(node => {
    if (ts.isInterfaceDeclaration(node)) {
      interfaces.set(node.name.text, node)
    }
  })

  const root = interfaces.get('ClockWeatherCardConfig')
  if (!root) throw new Error('ClockWeatherCardConfig not found in src/types.ts')

  const paths: LeafPath[] = []
  const walkMembers = (members: ts.NodeArray<ts.TypeElement>, prefix: string[]): void => {
    for (const member of members) {
      if (!ts.isPropertySignature(member)) continue
      const name = (member.name as ts.Identifier).text
      walkType(member.type, [...prefix, name])
    }
  }
  const walkType = (typeNode: ts.TypeNode | undefined, prefix: string[]): void => {
    if (typeNode && ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
      const iface = interfaces.get(typeNode.typeName.text)
      if (iface) {
        walkMembers(iface.members, prefix)
        return
      }
    }
    if (typeNode && ts.isTypeLiteralNode(typeNode)) {
      walkMembers(typeNode.members, prefix)
      return
    }
    paths.push(prefix)
  }
  walkMembers(root.members, [])
  return paths
}

function expectedSpecPath(segments: LeafPath): string {
  const kebab = segments.map(s => s.replace(/_/g, '-'))
  if (kebab.length === 1) {
    return resolve(__dirname, `../../e2e/config-options/${kebab[0]}/${kebab[0]}.spec.ts`)
  }
  return resolve(__dirname, `../../e2e/config-options/${kebab.join('/')}.spec.ts`)
}

describe('every ClockWeatherCardConfig option has a dedicated e2e test fixture', () => {
  for (const segments of getConfigOptionPaths()) {
    const spec = expectedSpecPath(segments)
    it(`${segments.join('.')} → ${spec.split('/e2e/')[1]} exists`, () => {
      expect(existsSync(spec), `Missing ${spec}`)
        .toBe(true)
    })
  }
})

// Each leaf spec must include a "(no reload)" test asserting that the
// card reacts to runtime config / state changes without a page refresh.
describe('every config-options spec has a runtime-update (no reload) test', () => {
  for (const segments of getConfigOptionPaths()) {
    const spec = expectedSpecPath(segments)
    it(`${segments.join('.')} spec contains a "(no reload)" test`, () => {
      const content = readFileSync(spec, 'utf-8')
      expect(content, `Missing "(no reload)" test in ${spec}`)
        .toMatch(/\(no reload\)/)
    })
  }
})
