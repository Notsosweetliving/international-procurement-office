# ContractOS V0.7 Bid Workspace

## Upload and private storage

Authenticated users start a Bid Workspace from an opportunity detail page. Starting a workspace also saves the opportunity. PDF, DOCX, and TXT files up to 20MB are accepted. The server validates the filename, declared MIME type, extension, size, and file signature before upload.

Files are stored in the private Supabase Storage bucket `tender-documents` under `user_id/source/opportunity_id/document-id-filename`. The browser never supplies or controls the storage path. Downloads first validate the document row against the authenticated user and opportunity, then issue a five-minute signed URL. No public URLs are created.

## Text extraction

Parsing is server-only under `lib/documents/`:

- `pdf.ts` uses `pdf-parse` for embedded PDF text.
- `docx.ts` uses Mammoth raw-text extraction.
- `text.ts` decodes UTF-8 TXT content.
- `extract.ts` dispatches formats and creates bounded, overlapping text chunks.

Image-only PDFs are marked ready with the warning `Text could not be extracted automatically.` ContractOS does not silently invoke OCR in V0.7.

## Requirement extraction and traceability

Each bounded chunk is treated as untrusted source material and passed through a structured Zod schema. The model cannot set Match Score, Bid Readiness, or the user's decision. Requirements retain the source document and either a real extracted section reference or `Found in extracted text`; page numbers are never fabricated. Chunk results are conservatively deduplicated while retaining their source basis.

## Compliance matrix

Company-profile comparisons suggest one of: Meets, Likely meets, Needs evidence, Missing, Needs review, or Not applicable. Certification matches still default to Needs evidence. Government-experience claims require evidence. Users can override every suggested status and attach an opportunity-scoped document as evidence; the manual status is authoritative.

## Bid Readiness Score

Bid Readiness is deterministic and separate from Opportunity Match Score. It is bounded from 0 to 100:

- mandatory requirements satisfied: 35 points
- evidence attached: 20 points
- certifications addressed: 15 points
- submission checklist completed: 10 points
- financial and commercial requirements addressed: 10 points
- deadline readiness: 10 points

Empty categories receive their available category points rather than penalizing a tender for requirements it does not contain. Deadline points decline at 14, 7, and 3 days and become zero after closing. AI never assigns the final score.

## Bid / No-bid and checklist

The user records Undecided, Pursue, Review, or Do not bid. AI and deterministic checks may identify blockers, but never make the final legal or business decision. Submission requirements, certifications, and required documents populate a persistent checklist.

## Security

Every V0.7 table has RLS. Direct user-owned rows compare `auth.uid()` to `user_id`; extraction, compliance, and checklist rows inherit ownership through their parent document or workspace. Storage policies limit object access to paths whose first segment is the authenticated user ID. Server routes also validate ownership and never authorize from a client filename or storage path.

## Known limitations

V0.7 processing is synchronous and intentionally bounded. It has no OCR, background queue, reusable company evidence vault, tender-update notifications, or automated submission. Extraction quality depends on embedded source text. Complex tables and document layout are reduced to text, and all generated guidance must be checked against official tender documents.

## Apply the migration

From the project directory, after linking the intended Supabase project:

```bash
npx supabase db push
```
