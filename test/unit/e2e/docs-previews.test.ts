import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { loopDuration } from '../../../e2e/docs/animation'
import { collectPreviews, parsePreviews, previewImage, PREVIEWS_DIR, PROJECT_DIR, README } from '../../../e2e/docs/previews'

const markdown = (meta: string, yaml = 'type: custom:clock-weather-card\nentity: weather.home\n'): string =>
  `# Title\n\n<!-- preview: ${meta} -->\n\`\`\`yaml\n${yaml}\`\`\`\n`

describe('parsePreviews', () => {
  it('ignores markdown without previews', () => {
    expect(parsePreviews('```yaml\ntype: custom:clock-weather-card\n```'))
      .toEqual([])
  })

  it('reads the card config of the YAML block that follows the comment, without the entity', () => {
    const [preview] = parsePreviews(markdown('static', 'type: custom:clock-weather-card\nentity: weather.home\ntitle: Hi\n'))
    expect(preview)
      .toMatchObject({ name: 'static', cardConfig: { title: 'Hi' }, dark: false, animated: false })
    expect(previewImage(preview))
      .toBe('docs/previews/static.png')
  })

  it('reads theme, mock state and animated', () => {
    const [preview] = parsePreviews(markdown(`animated
theme: { repo: owner/repo, version: v1.0.0, name: My Theme }
dark: true
weather: { state: rainy, temperature: 12 }
sun: { state: below_horizon }
language: de
time_zone: America/New_York
unit_system: us_customary
entities: { sensor.uv: { state: '5', attributes: { icon: mdi:sun } } }
animated: true
`))
    expect(preview)
      .toMatchObject({
        theme: { repo: 'owner/repo', version: 'v1.0.0', name: 'My Theme' },
        dark: true,
        mock: {
          weather: { state: 'rainy', temperature: 12 },
          sun: { state: 'below_horizon' },
          language: 'de',
          timeZone: 'America/New_York',
          unitSystem: 'us_customary',
        },
        entities: { 'sensor.uv': { state: '5', attributes: { icon: 'mdi:sun' } } },
        animated: true,
      })
    expect(previewImage(preview))
      .toBe('docs/previews/animated.gif')
  })

  it.each([
    ['Not_Kebab', 'name must be kebab-case'],
    ['a\nthme: x', 'unknown keys thme'],
    ['a\ntheme: { repo: owner/repo, name: x }', 'theme needs repo, version and name'],
  ])('rejects %j', (meta, message) => {
    expect(() => parsePreviews(markdown(meta)))
      .toThrow(message)
  })

  it('rejects a YAML block that is not a card config', () => {
    expect(() => parsePreviews(markdown('a', 'title: Hi\n')))
      .toThrow('Preview "a": the YAML block must be a card config')
  })
})

describe('loopDuration', () => {
  it('is the least common multiple of the icon animation durations', () => {
    expect(loopDuration([6000, 3000, 1000]))
      .toBe(6000)
    expect(loopDuration([1000, 1500]))
      .toBe(3000)
  })

  it('requires animated icons', () => {
    expect(() => loopDuration([]))
      .toThrow('No animated icons visible')
  })

  it('rejects overly long loops', () => {
    expect(() => loopDuration([7000, 3000]))
      .toThrow('Icons only loop after 21000ms')
  })
})

describe('docs previews of this repository', () => {
  const previews = collectPreviews()

  const markdown = readFileSync(README, 'utf-8')

  it.each(previews.map(p => [p.name, p] as const))('%s is embedded in the README and rendered', (_, preview) => {
    expect(markdown)
      .toContain(`](${previewImage(preview)})`)
    if (preview.theme) expect(markdown, 'link the theme next to its preview')
      .toContain(`](https://github.com/${preview.theme.repo}/tree/${preview.theme.version})`)
    expect(existsSync(path.join(PROJECT_DIR, previewImage(preview))), `run yarn test:e2e:update-snapshots to render ${previewImage(preview)}`)
      .toBe(true)
  })

  it('has no rendered images without a preview', () => {
    expect(readdirSync(path.join(PROJECT_DIR, PREVIEWS_DIR))
      .map(f => `${PREVIEWS_DIR}/${f}`)
      .sort())
      .toEqual(previews.map(previewImage)
        .sort())
  })
})
