# Data Model

## Tenant-Owned Records

Every Company, Project and future content record carries `tenantId` (or the codebase's equivalent explicit Company relation). Queries and mutations must scope by that value before applying record IDs or slugs.

## Sprint 1 Entities

### Company / Tenant

`id`, `legalName`, `displayName`, `slug`, `status`, `templateKey`, `primaryCommodity`, `jurisdiction`, `tickerSymbol`, `exchange`, `shortDescription`, `longDescription`, `investmentThesis`, contact fields, branding fields, timestamps.

### User and Membership

User identity is separate from tenant membership. Membership contains `userId`, `tenantId`, `role`, `status`, invitation timestamps and acceptance timestamp. Sprint 1 roles are Platform Admin and Company Admin; Editor and Viewer remain modeled for later use.

### Project

`id`, `tenantId`, `name`, `slug`, `status`, `isFlagship`, `commodity`, `jurisdiction`, `locationSummary`, ownership, stage, summary, highlights, technical summary, display order and timestamps.

## Publication Metadata

Publishable records use `Draft`, `Review`, `Published` and `Archived`. Disclosure-sensitive records must also retain reviewer identity and review timestamp when approved. Public queries must include both tenant scope and `status = Published`.

## Seed Data

Seed Aurora Gold with one active Company Admin membership and at least one published flagship Project. Include a second tenant fixture in tests to prove isolation.

## Integrity Rules

- Company slug is unique within the public hostname strategy.
- Project slug is unique within a tenant.
- A Project cannot reference a Project or content record belonging to another tenant.
- A Company Admin cannot change `tenantId` through an update payload.
- Published technical content requires an approved review transition.

## Sprint 2 Collections (implemented)

Collections `news-releases`, `documents`, `people`, `share-structures`, and `exploration-contents` follow the tenant + publication + review metadata pattern. Material types require `sourceUrl` or `sourceDocument` (or document `externalUrl`/`file`) before Review/Published. Related `project` / `sourceDocument` / `media` must belong to the same tenant.

### News Release

`tenant`, optional `project`, `title`, `slug`, `releaseDate`, `excerpt`, `body`, `sourceUrl` or `sourceDocument`, `disclosureLevel`, `status`, `reviewedBy`, `reviewedAt`, `publishedAt`, timestamps.

### Document / Presentation

`tenant`, `title`, `slug`, `category`, `publicationDate`, `externalUrl` or media reference, optional related project, `disclosureLevel`, `status`, review metadata, timestamps.

### Person / Management

`tenant`, `name`, `roleTitle`, `group`, `biography`, optional headshot/media, `displayOrder`, `status`, review metadata where needed, timestamps.

### Share Structure

`tenant`, `asOfDate`, `sharesOutstanding`, `options`, `warrants`, `fullyDiluted`, `note`, `sourceUrl` or `sourceDocument`, `status`, review metadata, timestamps.

### Exploration Content

`tenant`, `project`, `title`, `date`, `summary`, `technicalDetails`, `sourceUrl` or `sourceDocument`, `disclosureLevel`, `status`, `reviewedBy`, `reviewedAt`, `publishedAt`, timestamps.

## Cross-Collection Rules

- A related project and source document must belong to the same tenant.
- Slugs are unique within the tenant and collection.
- Material facts require a source reference before Review or Published.
- Public serializers omit internal review fields and return only published records.
- Published records are immutable for disclosure-sensitive fields; edits create a new Review state or are rejected.
- Every new collection gets a second-tenant isolation fixture and published/draft seed pair in tests.
