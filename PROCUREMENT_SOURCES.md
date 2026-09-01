# ContractOS procurement sources

## EU TED

- Official source: EU Tenders Electronic Daily Search API v3.
- Authentication: none for the public search endpoint.
- Fields: title, buyer, countries, CPV, description, dates, value, currency and procedure.
- Cache: 30 minutes. Requests time out after 10 seconds.
- Normalization: TED fields are converted into the shared `Opportunity` model and stable `ted-` IDs.
- Limitations: some notices omit values, deadlines or English descriptions.

## NATO / NCIA

- Official source: NCIA public Procurement Opportunities bulletin.
- Authentication: the public bulletin is readable without credentials; Neo registration may be required to participate.
- Integration: V0.6 supports an approved structured JSON endpoint through `NATO_OPPORTUNITIES_URL`.
- Cache: 60 minutes for a configured feed.
- Normalization: reference, organization, dates, estimated value, method and description become a normalized `Opportunity` with a stable `nato-` ID.
- Limitations: NCIA does not document a stable public structured API. ContractOS deliberately does not scrape the bulletin. Without an approved feed, provider health reports NATO unavailable and links users to the official bulletin.

## UK Find a Tender

- Official source: Find a Tender OCDS release package API 1.0.
- Authentication: none.
- Fields: OCID, title, buyer, address, CPV classification, tender period, value, currency, method and description.
- Cache: 20 minutes. Requests time out after 12 seconds.
- Normalization: OCDS releases become stable `uk-<ocid>` opportunities. Search is applied conservatively to the latest tender-stage release batch.
- Limitations: the release package API is cursor-oriented; V0.6 provides a practical recent-results view rather than exhaustive global pagination.

## US Federal / SAM.gov

- Official source: SAM.gov Get Opportunities Public API v2 at `https://api.sam.gov/opportunities/v2/search`.
- Authentication: `SAM_API_KEY` from a SAM.gov account is required.
- Fields: notice and solicitation IDs, title, federal organization, place of performance, dates, NAICS, PSC, notice type, description link and award value where present.
- Cache: 20 minutes. Requests time out after 12 seconds.
- Normalization: SAM notices become stable `sam-` opportunities. NAICS drives broad capability alignment; PSC remains preserved as metadata.
- Rate limits: determined by the SAM.gov account role. ContractOS caps each provider request and relies on server caching rather than repeated calls.
- Limitations: detailed descriptions may be returned as authenticated links rather than inline text. No classified opportunities or management APIs are used.

## Unified behavior

Providers run in parallel with `Promise.allSettled`. A failed or unconfigured source cannot discard successful results from other sources. Exact title, buyer and deadline matches are conservatively de-duplicated; uncertain duplicates remain separate. Up to 30 results are requested per source and the merged first 50 are returned.
