import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import api from '../utils/ha-api'
import { readHaState } from '../utils/ha-state'

export interface ThemeRef {
  repo: string
  version: string
  name: string
}

// HACS theme repositories keep their theme YAML in `themes/`, which HA's `!include_dir_merge_named` picks up recursively.
export async function installThemes(refs: ThemeRef[]): Promise<void> {
  const releases = new Map(refs.map(r => [`${r.repo}@${r.version}`, r]))
  await Promise.all([...releases].map(async ([release, { repo, version }]) => {
    const target = path.join(readHaState().tmpDir, 'themes', release.replace(/[/@]/g, '_'))
    if (existsSync(target)) return
    const res = await fetch(`https://codeload.github.com/${repo}/tar.gz/${version}`)
    if (!res.ok) throw new Error(`Downloading theme ${release} failed: ${res.status} ${res.statusText}`)
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'theme-'))
    try {
      execFileSync('tar', ['-xz', '--strip-components=1'], { cwd: tmp, input: Buffer.from(await res.arrayBuffer()) })
      if (!existsSync(path.join(tmp, 'themes'))) throw new Error(`Theme ${release} has no themes/ directory`)
      cpSync(path.join(tmp, 'themes'), target, { recursive: true })
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  }))
  await api.callService('frontend', 'reload_themes')
  const available = Object.keys((await api.getThemes()).themes)
  for (const { repo, version, name } of refs) {
    if (!available.includes(name)) throw new Error(`Theme "${name}" not found in ${repo}@${version}, available: ${available.join(', ')}`)
  }
}
