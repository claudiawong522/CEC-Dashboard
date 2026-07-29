# CEC Dashboard

Internal dashboard for the Cornell Entrepreneurship Club to organize events and manage admin access.

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui, Supabase (Postgres, Google OAuth, Storage), FullCalendar, BlockNote.

## Setup

1. Create a Supabase project.
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Project Settings → API.
   - `SEED_ADMIN_EMAIL` — the `@cornell.edu` address to seed as the first admin.
3. In Google Cloud Console, create an OAuth Client ID (Web application), External consent screen, scopes `email profile openid`, redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`. Paste the Client ID/Secret into Supabase Dashboard → Authentication → Providers → Google.
4. Apply the schema: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
5. `npm run dev`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run test` — Vitest unit tests
