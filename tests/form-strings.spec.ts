import { describe, expect, it } from 'vitest'

import { clearableString, optionalString } from '@/lib/form-strings'

describe('form string helpers', () => {
  it('optionalString omits blanks', () => {
    expect(optionalString('')).toBeUndefined()
    expect(optionalString('  ')).toBeUndefined()
    expect(optionalString(' https://a.example/x ')).toBe('https://a.example/x')
  })

  it('clearableString nulls blanks so Payload clears fields on update', () => {
    expect(clearableString('')).toBeNull()
    expect(clearableString('   ')).toBeNull()
    expect(clearableString(undefined)).toBeNull()
    expect(clearableString(' https://example.com/a.pdf ')).toBe('https://example.com/a.pdf')
  })
})
