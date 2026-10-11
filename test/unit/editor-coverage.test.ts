import { describe, expect, it } from 'vitest'

import { editorPaths, ROW_FIELDS, SEGMENT_FIELDS } from '@/editor/fields'

import { collectConfigPaths, interfaceMembers, segmentMembers } from './config-paths'

const names = (fields: { name: string }[]): string[] => fields.map(f => f.name)
  .sort()

describe('the GUI editor covers every YAML option', () => {
  it('card and section options', () => {
    expect(editorPaths()
      .sort())
      .toEqual(collectConfigPaths().leaves.map(p => p.join('.'))
        .sort())
  })

  it('row options', () => {
    expect(names(ROW_FIELDS))
      .toEqual(interfaceMembers('RowConfig')
        .sort())
  })

  for (const [type, members] of Object.entries(segmentMembers())) {
    it(`${type} segment options`, () => {
      expect(names(SEGMENT_FIELDS[type as keyof typeof SEGMENT_FIELDS] ?? []))
        .toEqual(members.sort())
    })
  }
})
