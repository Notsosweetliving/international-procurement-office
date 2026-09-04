# IPO procurement ingestion

IPO stores normalized public procurement notices in Supabase so ordinary searches, dashboard recommendations, detail pages, saves, AI analysis and bid workspaces do not depend on an upstream API being available at page-load time.

## Architecture

`provider adapter → shared Opportunity normalizer → bounded sync → procurement_opportunities upsert → cached product reads`

TED, Find a Tender and SAM reuse the existing provider adapters and shared `Opportunity` model. The unique `(source, source_opportunity_id)` key updates a notice when it is seen again. A bounded response never causes missing records to be deleted or marked inactive. New records whose deadline has already passed are stored inactive.

`procurement_source_sync_state` records the last attempt and success, safe error classification, fetched/inserted/updated counts, and stale state. Exact failures are visible only in admin. Ordinary pages show cached results and one quiet freshness label.

## Provider policy

- TED: at most `PROCUREMENT_SYNC_MAX_REQUESTS_PER_RUN` requests (default 2) per run, 100 notices per page.
- UK: one bounded 100-record request per run because the current verified FTS endpoint supplies the recent release package page.
- SAM: disabled by default. Set `SAM_SYNC_ENABLED=true` only after adding a server-side `SAM_API_KEY`. It defaults to one request and a 90-day lookback. A 429 stops immediately, performs no deletion, preserves all cached US records and marks SAM stale.
- NATO: integration-ready only. IPO does not scrape NATO. The user interface labels it “coming soon” until an approved structured feed is configured.

## Triggers and authorization

Admins listed in `ADMIN_EMAILS` can run a bounded TED, UK or SAM sync from `/admin`. The route authenticates the Supabase user and repeats the admin allowlist check server-side.

Vercel invokes `GET /api/internal/sync-opportunities`. The route fails closed unless `Authorization: Bearer <CRON_SECRET>` matches the server-side secret. An optional `?source=TED`, `UK`, or `SAM` performs a source-specific run.

`vercel.json` schedules one daily all-source run at 03:15 UTC. This conservative schedule is compatible with Vercel Hobby's daily cron limit and ensures SAM is never scheduled more than daily. On a plan supporting more frequent cron jobs, add source-specific TED and UK jobs every 4–6 hours; keep SAM daily.

## Production setup

1. Apply `supabase/migrations/202609040001_procurement_cache.sql` to the production Supabase project.
2. Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` exist in Vercel Production. The service role must remain server-only.
3. Add a strong `CRON_SECRET` in Vercel Production. Vercel Cron sends it as a bearer token.
4. Configure `ADMIN_EMAILS` for manual admin sync.
5. Leave `TED_API_BASE_URL` and `UK_FTS_API_BASE_URL` unset unless overriding their official defaults.
6. For SAM, add `SAM_API_KEY`, set `SAM_SYNC_ENABLED=true`, and keep `SAM_SYNC_MAX_REQUESTS_PER_RUN=1` initially. Optionally set `SAM_SYNC_LOOKBACK_DAYS` (default 90).
7. Deploy, open `/admin`, and run TED then UK once to seed the cache. Run SAM once only when quota is available.
8. Verify `/opportunities`, `/dashboard`, one detail page, and `/api/ai/search` read cached notices even if provider access is unavailable.

No provider API is called by normal user search, dashboard, detail, or AI search requests.
