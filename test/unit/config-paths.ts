import { readFileSync } from 'fs'
import { resolve } from 'path'
import * as ts from 'typescript'

const source = ts.createSourceFile(
  'types.ts',
  readFileSync(resolve(__dirname, '../../src/types.ts'), 'utf-8'),
  ts.ScriptTarget.ESNext,
)

const findInterface = (name: string): ts.InterfaceDeclaration => {
  const node = source.statements.find((n): n is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(n) && n.name.text === name)
  if (!node) throw new Error(`${name} not found in src/types.ts`)
  return node
}

const memberName = (member: ts.PropertySignature): string => (member.name as ts.Identifier).text

export function interfaceMembers(name: string): string[] {
  return findInterface(name).members.filter(ts.isPropertySignature)
    .map(memberName)
}

// Maps each member of the SegmentConfig union to its `type` literal and remaining option names.
export function segmentMembers(): Record<string, string[]> {
  const union = source.statements.find((n): n is ts.TypeAliasDeclaration => ts.isTypeAliasDeclaration(n) && n.name.text === 'SegmentConfig')
  if (!union || !ts.isUnionTypeNode(union.type)) throw new Error('SegmentConfig union not found in src/types.ts')
  return Object.fromEntries(union.type.types.map((t) => {
    const members = findInterface(t.getText(source)).members.filter(ts.isPropertySignature)
    const typeMember = members.find(m => memberName(m) === 'type')!
    const literal = ((typeMember.type as ts.LiteralTypeNode).literal as ts.StringLiteral).text
    return [literal, members.map(memberName)
      .filter(n => n !== 'type')]
  }))
}

export function collectConfigPaths(): { leaves: string[][], objects: string[][] } {
  const leaves: string[][] = []
  const objects: string[][] = []
  const walk = (members: ts.NodeArray<ts.TypeElement>, prefix: string[]): void => {
    for (const member of members.filter(ts.isPropertySignature)) {
      const path = [...prefix, memberName(member)]
      if (member.type && ts.isTypeLiteralNode(member.type)) {
        objects.push(path)
        walk(member.type.members, path)
      } else {
        leaves.push(path)
      }
    }
  }
  walk(findInterface('ClockWeatherCardConfig').members, [])
  return { leaves, objects }
}
