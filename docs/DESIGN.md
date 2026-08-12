# Sprint 1 Design

## Public Explorer

Home communicates Aurora Gold's identity, positioning, investment thesis, highlights, flagship project and key metrics. Projects lists published projects. Project Detail presents summary, jurisdiction, commodity, stage, ownership, highlights, map placeholder and source links for material technical claims.

## Company Dashboard

The dashboard contains Overview, Company Profile, Projects, Preview/Public Links and Settings placeholder. Profile and project forms need labels, validation, save feedback and clear publication state. Draft and Review content must remain private.

## Platform Admin

Provide a minimal tenant list and user/membership view. Platform Admin access must be visibly distinct from Company Admin access.

## Required States

Design loading, empty, validation error, save success, save error, unauthorized, forbidden and not-found states. Keep layout stable when statuses, errors or long company names appear.

## Accessibility and Responsive Behavior

Use semantic headings, keyboard-accessible controls, visible focus states, labels and non-color status indicators. Check public pages and forms at mobile and desktop widths.

## SEO

Each public page needs a meaningful title, description and canonical slug-based URL. Do not publish draft metadata through page source or server responses.

## Sprint 2 Public Explorer

- News: chronological published release list and detail pages with release date, source link and related project.
- Documents: published presentation/document list grouped by category and publication date.
- Management: published team profiles with name, role and biography.
- Share Structure: published as-of date, counts, explanatory note and source reference.
- Exploration: published project-specific technical summaries with prominent source links near claims.

Use the existing Explorer visual language and tenant branding. Keep content pages scan-friendly, with clear dates, labels and source context. Do not make technical claims look like investment recommendations.

## Sprint 2 Dashboard

Provide a consistent management pattern for each content type: list view, create/edit form, Save Draft, Submit for Review, and Review/Approve for an authorized reviewer. Published records should be read-only or edited as a new draft.

Show disclosure level and source fields in the editor. Place source links close to material public claims. Do not show internal reviewer identity or draft notes to investors.
