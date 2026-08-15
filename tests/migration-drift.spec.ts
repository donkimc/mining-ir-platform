import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { Catalysts } from '@/collections/Catalysts'
import { Companies } from '@/collections/Companies'
import { Documents } from '@/collections/Documents'
import { ExplorationContents } from '@/collections/ExplorationContents'
import { InvestmentHighlights } from '@/collections/InvestmentHighlights'
import { Media } from '@/collections/Media'
import { NewsReleases } from '@/collections/NewsReleases'
import { People } from '@/collections/People'
import { Projects } from '@/collections/Projects'
import { ShareStructures } from '@/collections/ShareStructures'
import { TenantMemberships } from '@/collections/TenantMemberships'
import { Users } from '@/collections/Users'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = path.join(root, 'src/migrations')

type FieldLike = {
  name?: string
  type?: string
  fields?: FieldLike[]
  tabs?: Array<{ fields?: FieldLike[] }>
}

function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase()
}

function latestMigrationJsonPath(): string {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
  return path.join(migrationsDir, files[files.length - 1]!)
}

function walkFields(
  fields: FieldLike[] | undefined,
  out: Array<FieldLike & { columnPrefix: string }>,
  columnPrefix = '',
): void {
  if (!fields) return
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue
    if (field.type === 'tabs' && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) walkFields(tab.fields, out, columnPrefix)
      continue
    }
    if (field.type === 'row' || field.type === 'collapsible') {
      walkFields(field.fields, out, columnPrefix)
      continue
    }
    if (field.type === 'group') {
      const nextPrefix = field.name
        ? columnPrefix
          ? `${columnPrefix}_${toSnakeCase(field.name)}`
          : toSnakeCase(field.name)
        : columnPrefix
      walkFields(field.fields, out, nextPrefix)
      continue
    }
    if (field.type === 'array') {
      continue
    }
    if (field.name && field.type && field.type !== 'ui') {
      out.push({ ...field, columnPrefix })
    }
  }
}

function expectedColumns(field: FieldLike & { columnPrefix: string }): string[] {
  if (!field.name || !field.type) return []
  const base = field.columnPrefix
    ? `${field.columnPrefix}_${toSnakeCase(field.name)}`
    : toSnakeCase(field.name)
  if (field.type === 'relationship' || field.type === 'upload') return [`${base}_id`]
  return [base]
}

const collections = [
  Users,
  Companies,
  TenantMemberships,
  Projects,
  InvestmentHighlights,
  Catalysts,
  NewsReleases,
  Documents,
  People,
  ShareStructures,
  ExplorationContents,
  Media,
]

describe('migration drift guard', () => {
  it('fails when a collection field has no corresponding migration column', () => {
    const snapshotPath = latestMigrationJsonPath()
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as {
      tables?: Record<string, { columns?: Record<string, unknown> }>
    }
    const tables = snapshot.tables ?? {}
    const missing: string[] = []

    for (const collection of collections) {
      const tableName = `public.${toSnakeCase(collection.slug)}`
      const columns = tables[tableName]?.columns ?? {}
      const flat: Array<FieldLike & { columnPrefix: string }> = []
      walkFields(collection.fields as FieldLike[], flat)

      for (const field of flat) {
        for (const column of expectedColumns(field)) {
          if (!(column in columns)) {
            missing.push(`${collection.slug}.${field.name} → ${tableName}.${column}`)
          }
        }
      }
    }

    const migrationSql = fs
      .readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.ts') && name !== 'index.ts')
      .map((name) => fs.readFileSync(path.join(migrationsDir, name), 'utf8'))
      .join('\n')

    if (!/original_filename/.test(migrationSql)) {
      missing.push('media.originalFilename → migrations must include original_filename')
    }

    expect(missing, `Drift against ${path.basename(snapshotPath)}:\n${missing.join('\n')}`).toEqual([])
  })
})
