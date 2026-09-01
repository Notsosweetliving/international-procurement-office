# ContractOS Supplier Intelligence (V0.9)

Supplier Intelligence is a private, user-owned supplier directory and deterministic fulfilment-planning layer for Bid Workspaces. Apply `supabase/migrations/202608310002_contractos_v09_supplier_intelligence.sql` after the earlier migrations.

## Data and privacy

Private suppliers have an `owner_user_id`; shared records reserve a null owner for a future curated catalogue. Row-level security restricts private suppliers, notes, evidence, assignments, requirements and quotes to their owner. Store contacts and commercial data only when entitled to do so.

## Scores

Supplier Fit is decision support, not a guarantee: capability 30, geography 20, certifications 15, supplier type 10, brand compatibility 10, capacity/lead time 10 and evidence 5. Fulfilment Readiness uses critical assignments 35, fit 20, quotes 15, lead times 15, evidence 10 and logistics 5. Missing information earns no inferred credit and is shown as a gap.

## Provider architecture

`lib/suppliers/providers/manual.ts` exposes the private database provider. `web.ts` is an intentionally empty beta adapter: it does not scrape or import public data. Future providers must preserve provenance, terms, rate limits and privacy.

## Safety

The preliminary sourcing classifier excludes weapons, ammunition, explosives, missiles, firearms, munitions and ordnance. Quantities, specifications, quotes, capacity, lead times and profit are never fabricated. Cost planning uses only user-entered figures.
