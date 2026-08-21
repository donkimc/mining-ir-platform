import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Sprint 6: company-listings collection, summit template enum value, unique subdomain.
 * Avoid re-adding Sprint 5 reviewer_source_check FKs that already exist on upgraded DBs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_companies_template_key" ADD VALUE IF NOT EXISTS 'summit';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE TYPE "public"."enum_company_listings_listing_type" AS ENUM('equity', 'otc', 'other');
  `)
  await db.execute(sql`
    CREATE TYPE "public"."enum_company_listings_status" AS ENUM('draft', 'review', 'published', 'archived');
  `)
  await db.execute(sql`
    CREATE TYPE "public"."enum_company_listings_disclosure_level" AS ENUM('none', 'standard', 'technical');
  `)
  await db.execute(sql`
    CREATE TYPE "public"."enum_company_listings_content_origin" AS ENUM('human_authored', 'machine_assisted');
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "company_listings" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "symbol" varchar NOT NULL,
      "exchange" varchar NOT NULL,
      "market" varchar,
      "listing_type" "enum_company_listings_listing_type",
      "quote_currency" varchar,
      "is_primary" boolean DEFAULT false,
      "display_order" numeric DEFAULT 0,
      "status" "enum_company_listings_status" DEFAULT 'draft' NOT NULL,
      "disclosure_level" "enum_company_listings_disclosure_level" DEFAULT 'standard' NOT NULL,
      "source_url" varchar,
      "source_document_id" integer,
      "reviewed_by_id" integer,
      "reviewed_at" timestamp(3) with time zone,
      "published_at" timestamp(3) with time zone,
      "content_origin" "enum_company_listings_content_origin" DEFAULT 'human_authored',
      "origin_locked_at" timestamp(3) with time zone,
      "source_location" jsonb,
      "provenance_claims" jsonb,
      "extraction_run_id" varchar,
      "extraction_provider" varchar,
      "extraction_model" varchar,
      "extraction_model_version" varchar,
      "extracted_at" timestamp(3) with time zone,
      "reviewer_source_check_by_id" integer,
      "reviewer_source_check_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "company_listings_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "company_listings"
        ADD CONSTRAINT "company_listings_tenant_id_companies_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "company_listings"
        ADD CONSTRAINT "company_listings_source_document_id_documents_id_fk"
        FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "company_listings"
        ADD CONSTRAINT "company_listings_reviewed_by_id_users_id_fk"
        FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "company_listings"
        ADD CONSTRAINT "company_listings_reviewer_source_check_by_id_users_id_fk"
        FOREIGN KEY ("reviewer_source_check_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_company_listings_fk"
        FOREIGN KEY ("company_listings_id") REFERENCES "public"."company_listings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`CREATE INDEX IF NOT EXISTS "company_listings_tenant_idx" ON "company_listings" USING btree ("tenant_id");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "company_listings_symbol_idx" ON "company_listings" USING btree ("symbol");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "company_listings_exchange_idx" ON "company_listings" USING btree ("exchange");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "company_listings_source_document_idx" ON "company_listings" USING btree ("source_document_id");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "company_listings_reviewed_by_idx" ON "company_listings" USING btree ("reviewed_by_id");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "company_listings_reviewer_source_check_by_idx" ON "company_listings" USING btree ("reviewer_source_check_by_id");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "company_listings_updated_at_idx" ON "company_listings" USING btree ("updated_at");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "company_listings_created_at_idx" ON "company_listings" USING btree ("created_at");`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "company_listings_tenant_symbol_exchange_uidx" ON "company_listings" USING btree ("tenant_id", "symbol", "exchange");`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "companies_subdomain_idx" ON "companies" USING btree ("subdomain");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_company_listings_id_idx" ON "payload_locked_documents_rels" USING btree ("company_listings_id");`)

  // Migrate legacy ticker/exchange into one primary published listing per company.
  await db.execute(sql`
    INSERT INTO "company_listings" (
      "tenant_id", "symbol", "exchange", "is_primary", "display_order", "status",
      "disclosure_level", "source_url", "content_origin", "published_at", "created_at", "updated_at"
    )
    SELECT
      c."id",
      UPPER(TRIM(c."ticker_symbol")),
      TRIM(c."exchange"),
      true,
      0,
      'published',
      'standard',
      'https://example.invalid/fictional-listing-source',
      'human_authored',
      NOW(),
      NOW(),
      NOW()
    FROM "companies" c
    WHERE c."ticker_symbol" IS NOT NULL
      AND TRIM(c."ticker_symbol") <> ''
      AND c."exchange" IS NOT NULL
      AND TRIM(c."exchange") <> ''
      AND NOT EXISTS (
        SELECT 1 FROM "company_listings" cl
        WHERE cl."tenant_id" = c."id"
          AND cl."symbol" = UPPER(TRIM(c."ticker_symbol"))
          AND cl."exchange" = TRIM(c."exchange")
      );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_company_listings_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_company_listings_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "company_listings_id";
    DROP TABLE IF EXISTS "company_listings" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_company_listings_listing_type";
    DROP TYPE IF EXISTS "public"."enum_company_listings_status";
    DROP TYPE IF EXISTS "public"."enum_company_listings_disclosure_level";
    DROP TYPE IF EXISTS "public"."enum_company_listings_content_origin";
    DROP INDEX IF EXISTS "companies_subdomain_idx";
  `)
}
