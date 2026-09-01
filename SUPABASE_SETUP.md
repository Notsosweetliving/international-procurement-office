# ContractOS Supabase setup

## 1. Create the project

Create a project at [database.new](https://database.new). In the project dashboard, open **Connect** and copy the project URL and anonymous/publishable key.

## 2. Configure the application

Create `.env.local` from `.env.example` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` is optional and unused by V0.5. Never expose it in a `NEXT_PUBLIC_` variable.

## 3. Run migrations

Install and authenticate the Supabase CLI, then run from the project root:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

For a local Supabase stack, use `npx supabase start` followed by `npx supabase db reset`.

## 4. Create a test user

Start ContractOS, open `/signup`, and register with an email and password. If email confirmation is enabled, follow the confirmation link before signing in at `/login`. You can also create a user under **Authentication → Users** in the Supabase dashboard.

## 5. Row Level Security

Every user-owned table has RLS enabled. Policies derive ownership from `auth.uid()` and never accept a browser-supplied user ID. Child company tables use a protected ownership helper that resolves the authenticated user's company. Anonymous table access is revoked.

Run database policy checks with:

```bash
npx supabase test db
```

## 6. Verify saved opportunities

Sign in, open a TED opportunity, select **Save opportunity**, and check `/saved`. Sign in as another user and confirm the record is absent. Removing it from either the card or detail page should remove the row from `saved_opportunities`.

## 7. Verify persisted AI analysis

With `OPENAI_API_KEY` configured, analyze an opportunity. Reload the page and confirm **Analysis available in your private workspace** appears. The `ai_tender_analyses` row is scoped to the signed-in user and reused only while its source publication timestamp still matches.
