# Deployment

## Sprint 2 Target

Deploy the application to Vercel Pro Preview using a Supabase Pro staging project. Keep Production separate until Cursor implementation, Claude review and staging verification are complete.

## Services

- Vercel Pro: application hosting, Preview deployments and Production deployment.
- Supabase Pro: PostgreSQL database and initially Supabase Storage for Payload media.
- Cloudflare Free: DNS/CDN when a custom domain is connected.
- Resend: add when email invitations or password flows are enabled.

Amazon S3 and a separate Vercel database are optional. Do not add either for Sprint 2 unless the storage or database decision is recorded in an ADR.

## Environment Separation

Maintain distinct values for Vercel Preview and Production:

- `DATABASE_URI`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`
- `DEFAULT_TENANT_SLUG`
- `TENANT_PROXY_SECRET` where trusted proxy routing is used
- Persistent media-storage variables
- Email variables when email is enabled

Never commit or paste secret values into Git, Notion or documentation. Use staging-only accounts and fictional seed content.

### Environment preflight (`npm run check:env`)

Before repairing Vercel Preview or promoting to the real Production Supabase project, run:

```bash
npm run check:env
```

The script loads `.env.local`, then `.env.staging.local`, then `.env`. For each required variable (`DATABASE_URI`, `DATABASE_SSL_CA`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `DEFAULT_TENANT_SLUG`, `PAYLOAD_DATABASE_PUSH`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_ENDPOINT`) it prints only `PRESENT` or `MISSING` — never the value.

For `DATABASE_URI` it also prints a safe summary: username, host, port and password **length** (not the password). It warns when:

- the username is not `postgres.<project-ref>` (pooler form), or
- the host is `db.<ref>.supabase.co` with port `6543` (direct host + pooler port mix), or
- `PAYLOAD_DATABASE_PUSH` is `true`.

Exit code is non-zero if any required variable is missing. Use this when pointing Preview or Production at a new Supabase project so misconfigured pooler URIs are caught before a debugging cycle.

## Database and Media

Use a Supabase connection suitable for Vercel serverless runtime traffic. Keep schema changes controlled and repeatable; local `push: true` is not a production migration policy. Configure persistent object storage before relying on uploads because Vercel's local filesystem is ephemeral.

## Preview Checklist

- [ ] Repository connected to Vercel Pro.
- [ ] Preview build succeeds with `npm run build`.
- [ ] Preview variables point to Supabase Pro staging.
- [ ] Staging schema is migrated.
- [ ] Fictional Aurora Gold seed data exists.
- [ ] No production secrets or local URLs are present.
- [ ] Public Published-only reads work.
- [ ] Dashboard authentication and tenant isolation work.
- [ ] Sprint 2 review workflow works remotely.
- [ ] Media/document links work after redeploy.
- [ ] Claude reviewed the deployed Preview URL.

## Production Gate

Only after Preview verification and Claude's fixes are complete should the team configure Production variables, migrate the production database, seed production-safe admin access and connect the final domain.

## Sprint 3 Hardening Gate

The Sprint 2 implementation may be complete while Production remains blocked. Before promotion, verify and record all of the following:

- [x] Supabase Storage bucket is private; direct object URLs fail for Draft, Review, wrong-tenant and unauthenticated fixtures.
- [x] Session signing secret rotated; old sessions invalidated by design; remaining DB/S3/admin password rotation tracked as owner follow-up.
- [x] `DATABASE_SSL_CA` is configured and certificate verification is enabled in Preview and Production.
- [x] `PAYLOAD_DATABASE_PUSH` is disabled outside local development and no undocumented override bypasses the guard.
- [x] A controlled migration upgrades a copy of the prior Sprint 2 schema.
- [x] A real fictional Aurora Gold file is uploaded to Supabase Storage and remains correctly protected after Preview deploy.
- [x] Public API responses are explicitly minimized and do not reveal reviewer metadata.
- [x] Backup restore/rollback runbook present; migration down/up rehearsed (dashboard PITR optional follow-up).
- [x] The remediation changes are committed and the exact commit passes `npm run verify` plus migration-drift CI.
- [ ] An independent reviewer has inspected the deployed Preview and all Critical/High findings are closed or explicitly accepted.

Do not connect a production domain or invite real customers while any checkbox is incomplete.
