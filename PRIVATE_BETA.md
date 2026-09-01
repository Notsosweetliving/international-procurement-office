# ContractOS V1.0 Private Beta

## Environment

Required existing Supabase and OpenAI variables remain unchanged. V1.0 adds `BETA_ACCESS_MODE`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, and optional email/monitoring provider variables such as `EMAIL_PROVIDER`, `EMAIL_API_KEY`, and `SENTRY_DSN`.

Apply `supabase/migrations/202608310003_contractos_v10_private_beta.sql`. Create invitation rows only through a service-role/admin process; never expose unused codes. Set `BETA_ACCESS_MODE=true` for invite-only signup and false or unset for open signup.

## Plans and Stripe test setup

Beta Free limits: 10 AI analyses, 30 questions, 25 saved opportunities, 3 active workspaces, 25 suppliers and 5 saved searches per period. Pro is placeholder-priced at £99/month with higher limits; Team is contact-only. Create a recurring Stripe test price, set `STRIPE_PRICE_PRO`, point a test webhook at `/api/billing/webhook`, and subscribe to Checkout/subscription lifecycle events. The webhook rejects invalid or stale signatures.

## Alerts and email

Saved-search alerts support off, daily and weekly. Deadline reminders support 7, 3 and 1 day offsets. Generation writes deduplicated `notification_queue` rows. The default email provider intentionally throws and leaves messages queued; configure a provider adapter before running a delivery worker. No sent email is simulated.

## Admin and operations

Comma-separated `ADMIN_EMAILS` controls `/admin`. It exposes aggregate counts and configuration health only. Structured logging removes fields that resemble secrets, document content or notes. SAM health is configuration-only in admin; do not repeatedly probe it. Background ingestion remains future infrastructure.

## Deployment and security checklist

1. Apply all migrations and verify RLS using two test users.
2. Configure service-role secrets only in the server environment.
3. Configure Stripe test mode, verify webhooks, then deliberately switch live keys at launch.
4. Create beta invitations and trusted admin emails.
5. Configure an email adapter and queue worker, or accept queued-only alerts.
6. Configure error monitoring and scrub sensitive fields.
7. Verify signed document URLs, storage ownership and account deletion in staging.
8. Test AI and resource limits server-side.
9. Set production origins and secure redirect URLs in Supabase and Stripe.
10. Back up the database, document incident response, privacy terms and support ownership before public beta.
