import { describe, expect, it } from 'vitest'

import { PRESETS } from '@/editor/presets'

import { collectPreviews } from '../../e2e/docs/previews'

describe('starter layouts', () => {
  const previews = collectPreviews()

  for (const [key, sections] of Object.entries(PRESETS)
    .filter(([key]) => key !== 'default')) {
    it(`${key} matches its README gallery entry`, () => {
      expect(previews.find(p => p.name === `layout-${key.replace('_', '-')}`)?.cardConfig)
        .toEqual({ type: 'custom:clock-weather-card', sections })
    })
  }
})
