import { describe, expect, it, vi } from 'vitest'

import {
  assertProductionPushDisabled,
  resolveDatabaseSsl,
  resolveEnableDatabasePush,
} from '@/lib/database-guards'

describe('database production guards', () => {
  it('throws for push=true in production even during Next build phase', () => {
    expect(() =>
      assertProductionPushDisabled({
        NODE_ENV: 'production',
        NEXT_PHASE: 'phase-production-build',
        PAYLOAD_DATABASE_PUSH: 'true',
      }),
    ).toThrow(/PAYLOAD_DATABASE_PUSH=true is not allowed/)

    expect(() =>
      resolveEnableDatabasePush({
        NODE_ENV: 'production',
        NEXT_PHASE: 'phase-production-build',
        PAYLOAD_DATABASE_PUSH: 'true',
      }),
    ).toThrow(/PAYLOAD_DATABASE_PUSH=true is not allowed/)
  })

  it('throws for push=true when VERCEL_ENV=preview', () => {
    expect(() =>
      assertProductionPushDisabled({
        VERCEL_ENV: 'preview',
        PAYLOAD_DATABASE_PUSH: 'true',
      }),
    ).toThrow(/PAYLOAD_DATABASE_PUSH=true is not allowed/)
  })

  it('forces push off during build when push is not requested', () => {
    expect(
      resolveEnableDatabasePush({
        NODE_ENV: 'production',
        NEXT_PHASE: 'phase-production-build',
        PAYLOAD_DATABASE_PUSH: 'false',
      }),
    ).toBe(false)
  })

  it('throws for insecure SSL in production even with ALLOW_INSECURE_DB_SSL (hatch removed)', () => {
    expect(() =>
      resolveDatabaseSsl({
        NODE_ENV: 'production',
        NEXT_PHASE: 'phase-production-build',
        DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
        ALLOW_INSECURE_DB_SSL: 'true',
      }),
    ).toThrow(/DATABASE_SSL_REJECT_UNAUTHORIZED=false is not allowed/)
  })

  it('requires DATABASE_SSL_CA on Vercel Preview/Production', () => {
    expect(() =>
      resolveDatabaseSsl({
        VERCEL: '1',
        VERCEL_ENV: 'preview',
      }),
    ).toThrow(/DATABASE_SSL_CA is required/)

    expect(() =>
      resolveDatabaseSsl({
        VERCEL_ENV: 'production',
      }),
    ).toThrow(/DATABASE_SSL_CA is required/)
  })

  it('pins CA with rejectUnauthorized true when DATABASE_SSL_CA is set', () => {
    const ca = '-----BEGIN CERTIFICATE-----\nMII\n-----END CERTIFICATE-----'
    expect(
      resolveDatabaseSsl({
        VERCEL: '1',
        VERCEL_ENV: 'preview',
        DATABASE_SSL_CA: ca,
      }),
    ).toEqual({ ssl: { ca, rejectUnauthorized: true } })
  })

  it('allows local insecure SSL with a warning only outside production/Vercel', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(
      resolveDatabaseSsl({
        NODE_ENV: 'development',
        DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
      }),
    ).toEqual({ ssl: { rejectUnauthorized: false } })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('allows local production build without CA when not on Vercel', () => {
    expect(
      resolveDatabaseSsl({
        NODE_ENV: 'production',
        NEXT_PHASE: 'phase-production-build',
      }),
    ).toEqual({})
  })
})
