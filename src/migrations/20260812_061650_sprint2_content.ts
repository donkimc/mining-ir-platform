import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_platform_role" AS ENUM('platform_admin');
  CREATE TYPE "public"."enum_users_status" AS ENUM('active', 'invited', 'disabled');
  CREATE TYPE "public"."enum_companies_status" AS ENUM('active', 'suspended', 'provisioning');
  CREATE TYPE "public"."enum_companies_publication_status" AS ENUM('draft', 'review', 'published', 'archived');
  CREATE TYPE "public"."enum_companies_template_key" AS ENUM('explorer');
  CREATE TYPE "public"."enum_tenant_memberships_role" AS ENUM('platform_admin', 'company_admin', 'editor', 'viewer');
  CREATE TYPE "public"."enum_tenant_memberships_status" AS ENUM('active', 'invited', 'revoked');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'review', 'published', 'archived');
  CREATE TYPE "public"."enum_projects_stage" AS ENUM('early_exploration', 'advanced_exploration', 'resource_definition', 'development', 'production');
  CREATE TYPE "public"."enum_investment_highlights_status" AS ENUM('draft', 'review', 'published', 'archived');
  CREATE TYPE "public"."enum_catalysts_status" AS ENUM('draft', 'review', 'published', 'archived');
  CREATE TYPE "public"."enum_news_releases_disclosure_level" AS ENUM('none', 'standard', 'technical');
  CREATE TYPE "public"."enum_news_releases_status" AS ENUM('draft', 'review', 'published', 'archived');
  CREATE TYPE "public"."enum_documents_category" AS ENUM('presentation', 'technical_report', 'financial', 'other');
  CREATE TYPE "public"."enum_documents_disclosure_level" AS ENUM('none', 'standard', 'technical');
  CREATE TYPE "public"."enum_documents_status" AS ENUM('draft', 'review', 'published', 'archived');
  CREATE TYPE "public"."enum_people_group" AS ENUM('management', 'board', 'advisors', 'other');
  CREATE TYPE "public"."enum_people_disclosure_level" AS ENUM('none', 'standard', 'technical');
  CREATE TYPE "public"."enum_people_status" AS ENUM('draft', 'review', 'published', 'archived');
  CREATE TYPE "public"."enum_share_structures_status" AS ENUM('draft', 'review', 'published', 'archived');
  CREATE TYPE "public"."enum_exploration_contents_disclosure_level" AS ENUM('none', 'standard', 'technical');
  CREATE TYPE "public"."enum_exploration_contents_status" AS ENUM('draft', 'review', 'published', 'archived');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"platform_role" "enum_users_platform_role",
  	"status" "enum_users_status" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "companies_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "companies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"legal_name" varchar NOT NULL,
  	"display_name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_companies_status" DEFAULT 'active' NOT NULL,
  	"publication_status" "enum_companies_publication_status" DEFAULT 'draft' NOT NULL,
  	"template_key" "enum_companies_template_key" DEFAULT 'explorer' NOT NULL,
  	"primary_commodity" varchar,
  	"jurisdiction" varchar,
  	"ticker_symbol" varchar,
  	"exchange" varchar,
  	"website_domain" varchar,
  	"subdomain" varchar,
  	"brand_colors_primary" varchar,
  	"brand_colors_secondary" varchar,
  	"brand_colors_accent" varchar,
  	"short_description" varchar NOT NULL,
  	"long_description" varchar,
  	"investment_thesis" varchar,
  	"ir_contact_name" varchar,
  	"ir_contact_email" varchar,
  	"ir_contact_phone" varchar,
  	"office_address" varchar,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tenant_memberships" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"role" "enum_tenant_memberships_role" NOT NULL,
  	"status" "enum_tenant_memberships_status" DEFAULT 'active' NOT NULL,
  	"invited_at" timestamp(3) with time zone,
  	"accepted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "projects_source_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_projects_status" DEFAULT 'draft' NOT NULL,
  	"is_flagship" boolean DEFAULT false,
  	"commodity" varchar,
  	"jurisdiction" varchar,
  	"location_summary" varchar,
  	"latitude" numeric,
  	"longitude" numeric,
  	"ownership_percent" numeric,
  	"stage" "enum_projects_stage",
  	"summary" varchar,
  	"technical_summary" varchar,
  	"display_order" numeric DEFAULT 0,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "investment_highlights" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"display_order" numeric DEFAULT 0,
  	"status" "enum_investment_highlights_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "catalysts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"expected_timing" varchar,
  	"summary" varchar,
  	"display_order" numeric DEFAULT 0,
  	"status" "enum_catalysts_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "news_releases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"project_id" integer,
  	"release_date" timestamp(3) with time zone NOT NULL,
  	"excerpt" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"source_url" varchar,
  	"source_document_id" integer,
  	"disclosure_level" "enum_news_releases_disclosure_level" DEFAULT 'standard' NOT NULL,
  	"status" "enum_news_releases_status" DEFAULT 'draft' NOT NULL,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" "enum_documents_category" DEFAULT 'other' NOT NULL,
  	"publication_date" timestamp(3) with time zone NOT NULL,
  	"external_url" varchar,
  	"file_id" integer,
  	"project_id" integer,
  	"source_url" varchar,
  	"source_document_id" integer,
  	"disclosure_level" "enum_documents_disclosure_level" DEFAULT 'standard' NOT NULL,
  	"status" "enum_documents_status" DEFAULT 'draft' NOT NULL,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"role_title" varchar NOT NULL,
  	"group" "enum_people_group" DEFAULT 'management' NOT NULL,
  	"biography" varchar NOT NULL,
  	"headshot_id" integer,
  	"display_order" numeric DEFAULT 0,
  	"disclosure_level" "enum_people_disclosure_level" DEFAULT 'standard' NOT NULL,
  	"status" "enum_people_status" DEFAULT 'draft' NOT NULL,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "share_structures" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"as_of_date" timestamp(3) with time zone NOT NULL,
  	"shares_outstanding" numeric,
  	"options" numeric,
  	"warrants" numeric,
  	"fully_diluted" numeric,
  	"market_cap_note" varchar,
  	"source_url" varchar,
  	"source_document_id" integer,
  	"status" "enum_share_structures_status" DEFAULT 'draft' NOT NULL,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exploration_contents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"project_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"content_date" timestamp(3) with time zone NOT NULL,
  	"summary" varchar NOT NULL,
  	"technical_details" varchar NOT NULL,
  	"source_url" varchar,
  	"source_document_id" integer,
  	"disclosure_level" "enum_exploration_contents_disclosure_level" DEFAULT 'standard' NOT NULL,
  	"status" "enum_exploration_contents_status" DEFAULT 'draft' NOT NULL,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"companies_id" integer,
  	"tenant_memberships_id" integer,
  	"projects_id" integer,
  	"investment_highlights_id" integer,
  	"catalysts_id" integer,
  	"news_releases_id" integer,
  	"documents_id" integer,
  	"people_id" integer,
  	"share_structures_id" integer,
  	"exploration_contents_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_social_links" ADD CONSTRAINT "companies_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies" ADD CONSTRAINT "companies_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_highlights" ADD CONSTRAINT "projects_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_source_links" ADD CONSTRAINT "projects_source_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "investment_highlights" ADD CONSTRAINT "investment_highlights_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "catalysts" ADD CONSTRAINT "catalysts_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_releases" ADD CONSTRAINT "news_releases_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_releases" ADD CONSTRAINT "news_releases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_releases" ADD CONSTRAINT "news_releases_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_releases" ADD CONSTRAINT "news_releases_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_headshot_id_media_id_fk" FOREIGN KEY ("headshot_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "share_structures" ADD CONSTRAINT "share_structures_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "share_structures" ADD CONSTRAINT "share_structures_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "share_structures" ADD CONSTRAINT "share_structures_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exploration_contents" ADD CONSTRAINT "exploration_contents_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exploration_contents" ADD CONSTRAINT "exploration_contents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exploration_contents" ADD CONSTRAINT "exploration_contents_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exploration_contents" ADD CONSTRAINT "exploration_contents_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_companies_fk" FOREIGN KEY ("companies_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenant_memberships_fk" FOREIGN KEY ("tenant_memberships_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_investment_highlights_fk" FOREIGN KEY ("investment_highlights_id") REFERENCES "public"."investment_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_catalysts_fk" FOREIGN KEY ("catalysts_id") REFERENCES "public"."catalysts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_releases_fk" FOREIGN KEY ("news_releases_id") REFERENCES "public"."news_releases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_share_structures_fk" FOREIGN KEY ("share_structures_id") REFERENCES "public"."share_structures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exploration_contents_fk" FOREIGN KEY ("exploration_contents_id") REFERENCES "public"."exploration_contents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "companies_social_links_order_idx" ON "companies_social_links" USING btree ("_order");
  CREATE INDEX "companies_social_links_parent_id_idx" ON "companies_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "companies_slug_idx" ON "companies" USING btree ("slug");
  CREATE INDEX "companies_reviewed_by_idx" ON "companies" USING btree ("reviewed_by_id");
  CREATE INDEX "companies_updated_at_idx" ON "companies" USING btree ("updated_at");
  CREATE INDEX "companies_created_at_idx" ON "companies" USING btree ("created_at");
  CREATE INDEX "tenant_memberships_user_idx" ON "tenant_memberships" USING btree ("user_id");
  CREATE INDEX "tenant_memberships_tenant_idx" ON "tenant_memberships" USING btree ("tenant_id");
  CREATE INDEX "tenant_memberships_updated_at_idx" ON "tenant_memberships" USING btree ("updated_at");
  CREATE INDEX "tenant_memberships_created_at_idx" ON "tenant_memberships" USING btree ("created_at");
  CREATE INDEX "projects_highlights_order_idx" ON "projects_highlights" USING btree ("_order");
  CREATE INDEX "projects_highlights_parent_id_idx" ON "projects_highlights" USING btree ("_parent_id");
  CREATE INDEX "projects_source_links_order_idx" ON "projects_source_links" USING btree ("_order");
  CREATE INDEX "projects_source_links_parent_id_idx" ON "projects_source_links" USING btree ("_parent_id");
  CREATE INDEX "projects_tenant_idx" ON "projects" USING btree ("tenant_id");
  CREATE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_reviewed_by_idx" ON "projects" USING btree ("reviewed_by_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "investment_highlights_tenant_idx" ON "investment_highlights" USING btree ("tenant_id");
  CREATE INDEX "investment_highlights_updated_at_idx" ON "investment_highlights" USING btree ("updated_at");
  CREATE INDEX "investment_highlights_created_at_idx" ON "investment_highlights" USING btree ("created_at");
  CREATE INDEX "catalysts_tenant_idx" ON "catalysts" USING btree ("tenant_id");
  CREATE INDEX "catalysts_updated_at_idx" ON "catalysts" USING btree ("updated_at");
  CREATE INDEX "catalysts_created_at_idx" ON "catalysts" USING btree ("created_at");
  CREATE INDEX "news_releases_tenant_idx" ON "news_releases" USING btree ("tenant_id");
  CREATE INDEX "news_releases_slug_idx" ON "news_releases" USING btree ("slug");
  CREATE INDEX "news_releases_project_idx" ON "news_releases" USING btree ("project_id");
  CREATE INDEX "news_releases_source_document_idx" ON "news_releases" USING btree ("source_document_id");
  CREATE INDEX "news_releases_reviewed_by_idx" ON "news_releases" USING btree ("reviewed_by_id");
  CREATE INDEX "news_releases_updated_at_idx" ON "news_releases" USING btree ("updated_at");
  CREATE INDEX "news_releases_created_at_idx" ON "news_releases" USING btree ("created_at");
  CREATE INDEX "documents_tenant_idx" ON "documents" USING btree ("tenant_id");
  CREATE INDEX "documents_slug_idx" ON "documents" USING btree ("slug");
  CREATE INDEX "documents_file_idx" ON "documents" USING btree ("file_id");
  CREATE INDEX "documents_project_idx" ON "documents" USING btree ("project_id");
  CREATE INDEX "documents_source_document_idx" ON "documents" USING btree ("source_document_id");
  CREATE INDEX "documents_reviewed_by_idx" ON "documents" USING btree ("reviewed_by_id");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE INDEX "people_tenant_idx" ON "people" USING btree ("tenant_id");
  CREATE INDEX "people_headshot_idx" ON "people" USING btree ("headshot_id");
  CREATE INDEX "people_reviewed_by_idx" ON "people" USING btree ("reviewed_by_id");
  CREATE INDEX "people_updated_at_idx" ON "people" USING btree ("updated_at");
  CREATE INDEX "people_created_at_idx" ON "people" USING btree ("created_at");
  CREATE INDEX "share_structures_tenant_idx" ON "share_structures" USING btree ("tenant_id");
  CREATE INDEX "share_structures_source_document_idx" ON "share_structures" USING btree ("source_document_id");
  CREATE INDEX "share_structures_reviewed_by_idx" ON "share_structures" USING btree ("reviewed_by_id");
  CREATE INDEX "share_structures_updated_at_idx" ON "share_structures" USING btree ("updated_at");
  CREATE INDEX "share_structures_created_at_idx" ON "share_structures" USING btree ("created_at");
  CREATE INDEX "exploration_contents_tenant_idx" ON "exploration_contents" USING btree ("tenant_id");
  CREATE INDEX "exploration_contents_project_idx" ON "exploration_contents" USING btree ("project_id");
  CREATE INDEX "exploration_contents_source_document_idx" ON "exploration_contents" USING btree ("source_document_id");
  CREATE INDEX "exploration_contents_reviewed_by_idx" ON "exploration_contents" USING btree ("reviewed_by_id");
  CREATE INDEX "exploration_contents_updated_at_idx" ON "exploration_contents" USING btree ("updated_at");
  CREATE INDEX "exploration_contents_created_at_idx" ON "exploration_contents" USING btree ("created_at");
  CREATE INDEX "media_tenant_idx" ON "media" USING btree ("tenant_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_companies_id_idx" ON "payload_locked_documents_rels" USING btree ("companies_id");
  CREATE INDEX "payload_locked_documents_rels_tenant_memberships_id_idx" ON "payload_locked_documents_rels" USING btree ("tenant_memberships_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_investment_highlights_id_idx" ON "payload_locked_documents_rels" USING btree ("investment_highlights_id");
  CREATE INDEX "payload_locked_documents_rels_catalysts_id_idx" ON "payload_locked_documents_rels" USING btree ("catalysts_id");
  CREATE INDEX "payload_locked_documents_rels_news_releases_id_idx" ON "payload_locked_documents_rels" USING btree ("news_releases_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_people_id_idx" ON "payload_locked_documents_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_share_structures_id_idx" ON "payload_locked_documents_rels" USING btree ("share_structures_id");
  CREATE INDEX "payload_locked_documents_rels_exploration_contents_id_idx" ON "payload_locked_documents_rels" USING btree ("exploration_contents_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "companies_social_links" CASCADE;
  DROP TABLE "companies" CASCADE;
  DROP TABLE "tenant_memberships" CASCADE;
  DROP TABLE "projects_highlights" CASCADE;
  DROP TABLE "projects_source_links" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "investment_highlights" CASCADE;
  DROP TABLE "catalysts" CASCADE;
  DROP TABLE "news_releases" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "people" CASCADE;
  DROP TABLE "share_structures" CASCADE;
  DROP TABLE "exploration_contents" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_platform_role";
  DROP TYPE "public"."enum_users_status";
  DROP TYPE "public"."enum_companies_status";
  DROP TYPE "public"."enum_companies_publication_status";
  DROP TYPE "public"."enum_companies_template_key";
  DROP TYPE "public"."enum_tenant_memberships_role";
  DROP TYPE "public"."enum_tenant_memberships_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum_projects_stage";
  DROP TYPE "public"."enum_investment_highlights_status";
  DROP TYPE "public"."enum_catalysts_status";
  DROP TYPE "public"."enum_news_releases_disclosure_level";
  DROP TYPE "public"."enum_news_releases_status";
  DROP TYPE "public"."enum_documents_category";
  DROP TYPE "public"."enum_documents_disclosure_level";
  DROP TYPE "public"."enum_documents_status";
  DROP TYPE "public"."enum_people_group";
  DROP TYPE "public"."enum_people_disclosure_level";
  DROP TYPE "public"."enum_people_status";
  DROP TYPE "public"."enum_share_structures_status";
  DROP TYPE "public"."enum_exploration_contents_disclosure_level";
  DROP TYPE "public"."enum_exploration_contents_status";`)
}
