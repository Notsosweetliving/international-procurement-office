# International Procurement Office — Vercel staging deployment

Do not connect either planned custom domain yet. Deploy first to the Vercel-generated staging URL and configure the matching URL in Supabase Authentication and Stripe test-mode redirects.

## Required environment variables

Add these to Vercel for Preview and Production. Secret values must remain server-side.

| Variable                        | Visibility    | Purpose                                                          |
| ------------------------------- | ------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser-safe  | Supabase project URL used by SSR and browser authentication      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe  | Supabase anonymous key; authorization is enforced by RLS         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server secret | Invitations, usage events, admin aggregates and account deletion |
| `OPENAI_API_KEY`                | Server secret | AI tender analysis and questions                                 |
| `SAM_API_KEY`                   | Server secret | SAM.gov opportunity provider                                     |

`VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` are supplied automatically by Vercel and are used for metadata origins. Do not create `NEXT_PUBLIC_` copies of any secret.

## Optional environment variables

| Variable                             | Purpose                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| `OPENAI_MODEL`                       | Override the default server-side OpenAI model                      |
| `BETA_ACCESS_MODE`                   | Set `true` for invitation-only signup; unset/false for open signup |
| `ADMIN_EMAILS`                       | Comma-separated trusted emails permitted to access `/admin`        |
| `STRIPE_SECRET_KEY`                  | Stripe test secret key                                             |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser-safe Stripe publishable test key                           |
| `STRIPE_WEBHOOK_SECRET`              | Verification secret for `/api/billing/webhook`                     |
| `STRIPE_PRICE_PRO`                   | Stripe recurring test price for IPO Pro                            |
| `EMAIL_PROVIDER`                     | Email adapter selector; delivery remains queued when omitted       |
| `EMAIL_API_KEY`                      | Server-only email provider credential                              |
| `SENTRY_DSN`                         | Optional production error-monitoring endpoint                      |
| `NATO_OPPORTUNITIES_URL`             | Approved structured NATO JSON feed; never a scraper                |
| `TED_API_BASE_URL`                   | TED API override; normally use the default                         |
| `UK_FTS_API_BASE_URL`                | UK Find a Tender API override                                      |
| `SAM_API_BASE_URL`                   | SAM.gov API override                                               |

## Development only

- `.env.local` is for local development and must not be committed or uploaded.
- Provider base URL overrides should normally remain unset in Vercel.
- Never add localhost callback, success or cancellation URLs to production configuration.

## Staging checklist

1. Apply all Supabase migrations in timestamp order.
2. Verify RLS with two distinct staging users.
3. Add the Vercel deployment URL to Supabase Site URL and redirect allow-list.
4. Use Stripe test keys and register the Vercel `/api/billing/webhook` endpoint.
5. Set `BETA_ACCESS_MODE=true`, create a limited invite through a service-role admin process, and test signup.
6. Test upload, signed document access, export and account deletion using disposable staging data.
7. Confirm OpenAI, Stripe, SAM and service-role secrets never appear in browser bundles or client-visible responses.
8. Review source warnings and provider timeouts without repeatedly probing SAM.
9. Configure monitoring and alert delivery before inviting external beta users.

## Vercel build settings

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: managed automatically by Next.js/Vercel
- Node runtime: use a currently supported Vercel Node.js release
