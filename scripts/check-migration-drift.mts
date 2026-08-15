#!/usr/bin/env node
/**
 * CI entrypoint for schema/migration drift.
 * Prefer `npm run check:migration-drift` (vitest). This script delegates to that suite.
 */
import { spawnSync } from 'node:child_process'

const result = spawnSync(
  'npm',
  ['run', 'check:migration-drift'],
  { stdio: 'inherit', shell: process.platform === 'win32' },
)
process.exit(result.status ?? 1)
