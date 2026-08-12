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
