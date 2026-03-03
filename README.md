# Searchable Take-Home Starter

Minimal monorepo for the Searchable AI crawler analytics take-home.

## Stack

- Next.js `16.1.6`
- React `19.2.4`
- Supabase CLI `2.76.16`
- Tailwind CSS `4.2.1`
- Biome `2.4.5`
- TypeScript `5.9.3`
- Node.js `22.15.1+`

## Repo shape

```text
apps/
  web/          Next.js frontend
supabase/       database migrations, local config, edge functions
```

This stays small on purpose. For a take-home, the main signal is clarity and execution, not how many packages the repo has.
The repo is configured to run on Node 22+ so setup friction stays low on your current machine.

## Quick start

1. Install Node `22.15.1` or newer.
2. Run `npm install`.
3. Copy `apps/web/.env.example` to `apps/web/.env.local`.
4. Start local Supabase with `npm run db:start`.
5. Start the app with `npm run dev`.

For a hosted Supabase project, use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
For local Supabase started via the CLI, use the local `anon` key from `npm run db:status`.

## Scripts

- `npm run dev` starts the Next.js app from the repo root.
- `npm run build` builds the app.
- `npm run lint` runs Biome across the repo.
- `npm run format` formats tracked files with Biome.
- `npm run typecheck` runs the app TypeScript check.
- `npm run check` runs lint and typecheck together.
- `npm run db:start` boots local Supabase services.
- `npm run db:stop` stops local Supabase services.
- `npm run db:reset` reapplies migrations and seed data.
- `npm run db:status` prints local Supabase connection info.
- `npm run db:types` regenerates `apps/web/lib/database.types.ts` from the local schema.
- `npm run fn:serve:track` serves the `track` edge function locally.

## What is already wired

- Root workspace scripts and editor defaults.
- A presentable Next.js starter page and dashboard route.
- Supabase SSR client helpers in `apps/web/lib/supabase/`.
- Initial schema for `sites` and `crawler_events`.
- A starter `track` edge function with bot classification logic.
- Supabase env loading that prefers `PUBLISHABLE_KEY` and falls back to legacy `ANON_KEY`.

## Suggested implementation order

1. Replace the mock dashboard data with server-side Supabase queries.
2. Build the site creation flow and domain verification flow.
3. Decide whether your ingestion MVP is request-based, script-based, or both.
4. Add CSV export after your query layer is stable.
