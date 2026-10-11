import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse as parseYaml } from 'yaml'

import type { MockOptions } from '../utils/test-utils'
import type { ThemeRef } from './themes'

export const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const PREVIEWS_DIR = 'docs/previews'

type Mock = NonNullable<MockOptions>

export interface Preview {
  name: string
  cardConfig: Record<string, unknown>
  theme?: ThemeRef
  dark: boolean
  mock: Pick<Mock, 'weather' | 'sun' | 'language' | 'timeZone' | 'unitSystem'>
  animated: boolean
  entities: Record<string, { state: string, attributes?: Record<string, unknown> }>
}

const PREVIEW_PATTERN = /<!--\s*(preview:[\s\S]*?)-->\s*```ya?ml\n([\s\S]*?)```/g
const PREVIEW_KEYS = ['preview', 'theme', 'dark', 'weather', 'sun', 'language', 'time_zone', 'unit_system', 'entities', 'animated']

export const previewFile = (preview: Preview): string => `${preview.name}.${preview.animated ? 'gif' : 'png'}`
export const previewImage = (preview: Preview): string => `${PREVIEWS_DIR}/${previewFile(preview)}`

export const README = path.join(PROJECT_DIR, 'README.md')

export function collectPreviews(): Preview[] {
  const previews = parsePreviews(readFileSync(README, 'utf-8'))
  const duplicate = previews.find((p, i) => previews.findIndex(o => o.name === p.name) !== i)
  if (duplicate) throw new Error(`Preview "${duplicate.name}" is defined more than once`)
  return previews
}

export function parsePreviews(markdown: string): Preview[] {
  return [...markdown.matchAll(PREVIEW_PATTERN)].map(([, meta, yaml]) => {
    const spec = parseYaml(meta) as Record<string, unknown>
    const name = String(spec.preview)
    const fail = (message: string): never => { throw new Error(`Preview "${name}": ${message}`) }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) fail('name must be kebab-case')
    const unknown = Object.keys(spec)
      .filter(k => !PREVIEW_KEYS.includes(k))
    if (unknown.length) fail(`unknown keys ${unknown.join(', ')}, allowed: ${PREVIEW_KEYS.join(', ')}`)

    const cardConfig = (parseYaml(yaml) ?? {}) as Record<string, unknown>
    if (cardConfig.type !== 'custom:clock-weather-card') fail('the YAML block must be a card config with type: custom:clock-weather-card')
    // The docs show a real entity id, the preview always renders the mock weather entity.
    delete cardConfig.entity

    const theme = spec.theme as ThemeRef | undefined
    if (theme && !['repo', 'version', 'name'].every(k => typeof theme[k as keyof ThemeRef] === 'string')) fail('theme needs repo, version and name')

    return {
      name,
      cardConfig,
      theme,
      dark: spec.dark === true,
      mock: {
        weather: spec.weather as Preview['mock']['weather'],
        sun: spec.sun as Preview['mock']['sun'],
        language: spec.language as string | undefined,
        timeZone: spec.time_zone as string | undefined,
        unitSystem: spec.unit_system as Preview['mock']['unitSystem'],
      },
      animated: spec.animated === true,
      entities: (spec.entities ?? {}) as Preview['entities'],
    }
  })
}
