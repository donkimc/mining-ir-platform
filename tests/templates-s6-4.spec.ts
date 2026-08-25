import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { templateShellClass } from '../src/lib/templates'

const root = process.cwd()

describe('summit vs explorer presentation (ADR-0017 / S6-4)', () => {
  it('uses distinct shell classes', () => {
    expect(templateShellClass('explorer')).toBe('template-explorer')
    expect(templateShellClass('summit')).toBe('template-summit')
  })

  it('homepage shells differ in structure and section order, not colour alone', () => {
    const explorer = readFileSync(
      join(root, 'src/components/templates/ExplorerHome.tsx'),
      'utf8',
    )
    const summit = readFileSync(join(root, 'src/components/templates/SummitHome.tsx'), 'utf8')

    expect(explorer).toContain('data-template-region="explorer-hero"')
    expect(explorer).toContain('data-template-region="explorer-thesis"')
    expect(summit).toContain('data-template-region="summit-hero"')
    expect(summit).toContain('data-template-region="summit-metric-rail"')
    expect(summit).toContain('summit-highlight-list')
    expect(explorer).not.toContain('summit-metric-rail')

    // Explorer: thesis before flagship. Summit: flagship before thesis/highlights.
    expect(explorer.indexOf('explorer-thesis')).toBeLessThan(
      explorer.indexOf('explorer-flagship'),
    )
    expect(summit.indexOf('summit-flagship')).toBeLessThan(summit.indexOf('summit-highlights'))
    expect(summit.indexOf('summit-flagship')).toBeLessThan(summit.indexOf('summit-thesis'))
  })

  it('summit nav is IR-first relative to explorer', () => {
    const header = readFileSync(join(root, 'src/components/public/SiteHeader.tsx'), 'utf8')
    const summitBlock = header.slice(header.indexOf('summitLinks'), header.indexOf('function isCurrentPath'))
    const explorerBlock = header.slice(
      header.indexOf('explorerLinks'),
      header.indexOf('summitLinks'),
    )
    expect(explorerBlock.indexOf("label: 'About'")).toBeLessThan(
      explorerBlock.indexOf("label: 'Investors'"),
    )
    expect(summitBlock.indexOf("label: 'Investors'")).toBeLessThan(
      summitBlock.indexOf("label: 'About'"),
    )
  })
})
