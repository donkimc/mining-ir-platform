import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * ADR-0019 — database-level guarantee of at most one primary listing per tenant.
 *
 * The collection hook still rejects a second primary in the app path; this partial
 * unique index closes the concurrent-write race that app-level checks cannot see.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Demote duplicate primaries (keep lowest id) so the index can be created safely.
  await db.execute(sql`
    UPDATE "company_listings" AS cl
    SET "is_primary" = false
    WHERE cl."is_primary" = true
      AND cl."id" NOT IN (
        SELECT DISTINCT ON ("tenant_id") "id"
        FROM "company_listings"
        WHERE "is_primary" = true
        ORDER BY "tenant_id", "id"
      );
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "company_listings_one_primary_per_tenant_uidx"
      ON "company_listings" ("tenant_id")
      WHERE "is_primary" = true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "company_listings_one_primary_per_tenant_uidx";
  `)
}
