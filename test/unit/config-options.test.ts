import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import * as ts from 'typescript'
import { describe, expect, it } from 'vitest'

type LeafPath = string[]

function collectConfigPaths(): { leaves: LeafPath[], objects: LeafPath[] } {
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

  const leaves: LeafPath[] = []
  const objects: LeafPath[] = []
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
        objects.push(prefix)
        walkMembers(iface.members, prefix)
        return
      }
    }
    if (typeNode && ts.isTypeLiteralNode(typeNode)) {
      objects.push(prefix)
      walkMembers(typeNode.members, prefix)
      return
    }
    leaves.push(prefix)
  }
  walkMembers(root.members, [])
  return { leaves, objects }
}

const { leaves, objects } = collectConfigPaths()

function expectedLeafSpecPath(segments: LeafPath): string {
  const kebab = segments.map(s => s.replace(/_/g, '-'))
  if (kebab.length === 1) {
    return resolve(__dirname, `../../e2e/config-options/${kebab[0]}/${kebab[0]}.spec.ts`)
  }
  return resolve(__dirname, `../../e2e/config-options/${kebab.join('/')}.spec.ts`)
}

function expectedObjectSpecPath(segments: LeafPath): string {
  const kebab = segments.map(s => s.replace(/_/g, '-'))
  return resolve(__dirname, `../../e2e/${kebab.join('/')}.spec.ts`)
}

describe('every ClockWeatherCardConfig leaf has a dedicated e2e config-options spec', () => {
  for (const segments of leaves) {
    const spec = expectedLeafSpecPath(segments)
    it(`${segments.join('.')} → ${spec.split('/e2e/')[1]} exists`, () => {
      expect(existsSync(spec), `Missing ${spec}`)
        .toBe(true)
    })
  }
})

// Each leaf spec must include a "(no reload)" test asserting that the
// card reacts to runtime config / state changes without a page refresh.
describe('every config-options leaf has a runtime-update (no reload) test', () => {
  for (const segments of leaves) {
    const spec = expectedLeafSpecPath(segments)
    it(`${segments.join('.')} spec contains a "(no reload)" test`, () => {
      const content = readFileSync(spec, 'utf-8')
      expect(content, `Missing "(no reload)" test in ${spec}`)
        .toMatch(/\(no reload\)/)
    })
  }
})

// Every object node in the config tree (e.g. `sections`, `sections.daily_forecast`) gets
// a section-level spec at e2e/<path>.spec.ts where overview/cross-leaf tests live. If a
// particular object has nothing meaningful to test, the spec can be a noop placeholder.
describe('every ClockWeatherCardConfig object has a section-level e2e spec', () => {
  for (const segments of objects) {
    if (segments.length === 0) continue
    const spec = expectedObjectSpecPath(segments)
    it(`${segments.join('.')} → ${spec.split('/e2e/')[1]} exists`, () => {
      expect(existsSync(spec), `Missing ${spec}`)
        .toBe(true)
    })
  }
})
