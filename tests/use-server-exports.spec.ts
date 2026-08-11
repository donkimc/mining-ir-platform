import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'
import ts from 'typescript'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC_ROOT = path.join(ROOT, 'src')

function walkTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkTsFiles(full))
      continue
    }
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(full)
    }
  }
  return files
}

function isUseServerModule(sourceText: string): boolean {
  const trimmed = sourceText.trimStart()
  return trimmed.startsWith("'use server'") || trimmed.startsWith('"use server"')
}

function hasExportModifier(node: ts.Node): boolean {
  return Boolean(
    ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
  )
}

function hasAsyncModifier(node: ts.Node): boolean {
  return Boolean(
    ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword),
  )
}

function collectIllegalExports(filePath: string, sourceText: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const illegal: string[] = []

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && hasExportModifier(statement)) {
      const name = statement.name?.text ?? '<anonymous>'
      if (!hasAsyncModifier(statement)) {
        illegal.push(`sync function export \`${name}\``)
      }
      continue
    }

    if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const name = ts.isIdentifier(declaration.name) ? declaration.name.text : '<binding>'
        illegal.push(`non-function export \`${name}\``)
      }
      continue
    }

    if (ts.isClassDeclaration(statement) && hasExportModifier(statement)) {
      illegal.push(`class export \`${statement.name?.text ?? '<anonymous>'}\``)
      continue
    }

    if (ts.isExportAssignment(statement)) {
      illegal.push('default export assignment')
      continue
    }

    if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          if (element.isTypeOnly) continue
          illegal.push(`re-export \`${element.name.text}\``)
        }
      } else if (!statement.exportClause) {
        illegal.push('star re-export')
      }
    }
  }

  return illegal
}

describe("'use server' modules only export async functions", () => {
  it('rejects sync functions and non-function value exports', () => {
    const files = walkTsFiles(SRC_ROOT).filter((file) => {
      const text = fs.readFileSync(file, 'utf8')
      return isUseServerModule(text)
    })

    expect(files.length).toBeGreaterThan(0)

    const failures: string[] = []
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8')
      const illegal = collectIllegalExports(file, text)
      for (const issue of illegal) {
        failures.push(`${path.relative(ROOT, file)}: ${issue}`)
      }
    }

    expect(failures).toEqual([])
  })
})
