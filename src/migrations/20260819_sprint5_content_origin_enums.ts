import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Converts shared enum_content_origin → per-table enums Payload/drizzle expect.
 * Safe no-op when 20260818 already created per-table enums.
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

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    const enumType = `enum_${table}_content_origin`

    await db.execute(sql.raw(`
      DO $$ BEGIN
        CREATE TYPE "public"."${enumType}" AS ENUM('human_authored', 'machine_assisted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `))

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
  }

  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_content_origin";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_content_origin" AS ENUM('human_authored', 'machine_assisted');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  for (const table of TABLES) {
    const enumType = `enum_${table}_content_origin`
    await db.execute(sql.raw(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = '${table}'
            AND column_name = 'content_origin'
            AND udt_name = '${enumType}'
        ) THEN
          ALTER TABLE "${table}"
            ALTER COLUMN "content_origin" DROP DEFAULT;
          ALTER TABLE "${table}"
            ALTER COLUMN "content_origin" TYPE "public"."enum_content_origin"
            USING ("content_origin"::text::"public"."enum_content_origin");
          ALTER TABLE "${table}"
            ALTER COLUMN "content_origin" SET DEFAULT 'human_authored'::"public"."enum_content_origin";
        END IF;
      END $$;
    `))
    await db.execute(sql.raw(`DROP TYPE IF EXISTS "public"."${enumType}";`))
  }
}
