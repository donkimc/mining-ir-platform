import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const importMapPath = path.join(root, 'src/app/(payload)/cms/importMap.js')

/**
 * Guards against local `payload generate:importmap` silently dropping the S3 upload
 * handler when S3_* env vars are unset (blank CMS regression; S5-1 / prior 9617c16).
 */
describe('cms importMap S3 upload handler', () => {
  it('retains S3ClientUploadHandler entry', () => {
    const source = fs.readFileSync(importMapPath, 'utf8')
    expect(source).toMatch(/S3ClientUploadHandler/)
    expect(source).toMatch(
      /"@payloadcms\/storage-s3\/client#S3ClientUploadHandler"\s*:/,
    )
  })
})
