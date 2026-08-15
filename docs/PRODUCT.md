# Product

## Vision

Mining IR Platform is a self-service, multi-tenant SaaS that gives junior mining companies investor-ready websites and a content dashboard, without building one-off freelance sites.

## Personas

- **Investor** — public visitor, no login, sees Published content only.
- **Mining Company Admin** — authenticated tenant user editing company and project content.
- **Platform Admin** — master admin managing tenants, users and memberships.

## Sprint 1 Promise

Prove the loop: provision Aurora Gold → Company Admin edits tenant data → Explorer public site renders Published data only.

## Sprint 1 Surface

- Public Explorer: Home, Projects, Project Detail
- Placeholders only: News, Investors, Corporate, Contact
- Company Admin dashboard: Overview, Company Profile, Projects
- Platform Admin: Tenants list, Users/memberships

## Explicit Non-Goals for Sprint 1

Automated SEDAR+ ingestion, live quotes, investor CRM, billing, AI chatbot, social automation, advanced GIS, multiple production templates and self-serve public signup.

## Sprint 2 Goal

Turn the completed tenant-to-public-site foundation into a usable mining content system. Company Admins manage structured News, Documents, Management, Share Structure and Exploration content; Investors see only approved Published content in the Explorer template.

## Sprint 2 User Stories

- As a Company Admin, I can create and edit a News Release for my company and submit it for review.
- As a Company Admin, I can manage presentations and documents with publication dates, categories and source links.
- As a Company Admin, I can manage management profiles for my company.
- As a Company Admin, I can maintain share structure records with an as-of date and source context.
- As a Company Admin, I can add exploration content linked to the correct project.
- As an authorized reviewer, I can approve content through a separate status-only action.
- As an Investor, I can read published mining content without seeing drafts, internal review data or other tenants' content.

## Sprint 2 Non-Goals

Live market data, investor accounts, CRM, subscriptions, AI extraction, automated publication, regulatory ingestion, billing, advanced GIS and additional templates.

## Sprint 3 Goal

Make the Sprint 2 implementation safe to promote beyond staging. The product must protect unpublished mining disclosure across the application, storage layer, database connection, deployment configuration and public API, with reproducible recovery and review evidence.

## Sprint 3 User Stories

- As a Platform Admin, I can trust that a private document cannot be downloaded by guessing or copying a storage URL.
- As a Product Director, I can rotate exposed credentials and invalidate old sessions without leaving a known active secret.
- As an operator, I can upgrade an existing database with controlled migrations and recover from a failed deployment.
- As a Company Admin, I can upload a fictional document in staging and see it remain private until its content is Published.
- As an Investor, I receive only intentionally public Published fields and never internal reviewer or tenant-management metadata.
- As a reviewer, I can see evidence that the exact committed build was tested on Vercel Preview with Supabase Pro staging.

## Sprint 3 Non-Goals

Live market data, stock quotes, investor analytics, subscriptions, email alerts, CRM, billing, AI extraction, automated ingestion, regulatory integrations, advanced GIS and additional templates. These move to Sprint 4 or later.
