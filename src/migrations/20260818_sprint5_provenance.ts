import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Sprint 5 provenance columns (text default for content_origin).
 *
 * No companion `.json` snapshot: Payload drift CI compares only the latest migration
 * snapshot (`20260819_sprint5_content_origin_enums.json`), which supersedes this step
 * after the per-table enum follow-up. Omitting an intermediate snapshot is intentional
 * — not a missing artifact (S5-4).
 */

const TABLES = [
  'companies',
  'projects',
  'news_releases',
  'documents',
  'people',
  'share_structures',
  'exploration_contents',
] as const

function enumName(table: (typeof TABLES)[number]): string {
  return `enum_${table}_content_origin`
}

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    const enumType = enumName(table)

    await db.execute(sql.raw(`
      DO $$ BEGIN
        CREATE TYPE "public"."${enumType}" AS ENUM('human_authored', 'machine_assisted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `))

    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
        ADD COLUMN IF NOT EXISTS "content_origin" "public"."${enumType}" DEFAULT 'human_authored' NOT NULL,
        ADD COLUMN IF NOT EXISTS "origin_locked_at" timestamp(3) with time zone,
        ADD COLUMN IF NOT EXISTS "source_location" jsonb,
        ADD COLUMN IF NOT EXISTS "provenance_claims" jsonb,
        ADD COLUMN IF NOT EXISTS "extraction_run_id" varchar,
        ADD COLUMN IF NOT EXISTS "extraction_provider" varchar,
        ADD COLUMN IF NOT EXISTS "extraction_model" varchar,
        ADD COLUMN IF NOT EXISTS "extraction_model_version" varchar,
        ADD COLUMN IF NOT EXISTS "extracted_at" timestamp(3) with time zone,
        ADD COLUMN IF NOT EXISTS "reviewer_source_check_by_id" integer,
        ADD COLUMN IF NOT EXISTS "reviewer_source_check_at" timestamp(3) with time zone;
    `))

    // If an earlier draft of this migration used shared enum_content_origin, retarget the column.
    await db.execute(sql.raw(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = '${table}'
            AND column_name = 'content_origin'
            AND udt_name = 'enum_content_origin'
        ) THEN
          ALTER TABLE "${table}"
            ALTER COLUMN "content_origin" DROP DEFAULT;
          ALTER TABLE "${table}"
            ALTER COLUMN "content_origin" TYPE "public"."${enumType}"
            USING ("content_origin"::text::"public"."${enumType}");
          ALTER TABLE "${table}"
            ALTER COLUMN "content_origin" SET DEFAULT 'human_authored'::"public"."${enumType}";
        END IF;
      END $$;
    `))

    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "${table}"
          ADD CONSTRAINT "${table}_reviewer_source_check_by_id_users_id_fk"
          FOREIGN KEY ("reviewer_source_check_by_id") REFERENCES "public"."users"("id")
          ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `))
  }

  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_content_origin";
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
        DROP CONSTRAINT IF EXISTS "${table}_reviewer_source_check_by_id_users_id_fk";
    `))
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
        DROP COLUMN IF EXISTS "content_origin",
        DROP COLUMN IF EXISTS "origin_locked_at",
        DROP COLUMN IF EXISTS "source_location",
        DROP COLUMN IF EXISTS "provenance_claims",
        DROP COLUMN IF EXISTS "extraction_run_id",
        DROP COLUMN IF EXISTS "extraction_provider",
        DROP COLUMN IF EXISTS "extraction_model",
        DROP COLUMN IF EXISTS "extraction_model_version",
        DROP COLUMN IF EXISTS "extracted_at",
        DROP COLUMN IF EXISTS "reviewer_source_check_by_id",
        DROP COLUMN IF EXISTS "reviewer_source_check_at";
    `))
    await db.execute(sql.raw(`
      DROP TYPE IF EXISTS "public"."${enumName(table)}";
    `))
  }
}
