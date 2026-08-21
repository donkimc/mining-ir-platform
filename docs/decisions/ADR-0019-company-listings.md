# ADR-0019: Multi-Listing Company Listings Model

## Status

Accepted — Sprint 6.

## Context

Company records currently store a single `tickerSymbol` and `exchange`. Real junior issuers often need multiple listings.

## Decision

1. Add tenant-scoped `company-listings` with: `tenant`, `symbol` (uppercase), `exchange`, optional `market` / `listingType` / `quoteCurrency`, `isPrimary`, `displayOrder`, publication status, source URL/document where material, and review metadata per the existing disclosure model.
2. Unique constraint on `(tenant, symbol, exchange)`. At most one primary listing per tenant.
3. Migrate existing Company ticker/exchange into one primary Published listing per active tenant.
4. Keep legacy Company ticker/exchange fields temporarily as read-only compatibility until code-wide consumers move to listings.
5. Public serializers expose only Published listings for the resolved tenant.

## Consequences

- Forms and public Investors surfaces read listings; legacy fields remain for transitional display only.
- Migration is generated and committed with the schema change.
