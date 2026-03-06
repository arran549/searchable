# Bruno collection

This collection is for testing the local Supabase Edge Function.

## Setup

1. Start local Supabase with `npm run db:start`
2. Serve the function with `npm run fn:serve:track`
3. Open the `bruno/` folder in Bruno
4. Select the `local` environment
5. Create a local auth user in Supabase Studio
6. Run `supabase/snippets/create_local_test_site.sql` in the SQL editor
7. Replace `trackToken` in `bruno/environments/local.bru` with the returned `sites.tracking_token`
8. For one-off tests, change `userAgent` in `bruno/environments/local.bru`

## Requests

- `track status`: smoke test for function routing and env presence
- `post track event`: sends a JSON tracking event
- `pixel track`: hits the GIF pixel endpoint
- `track/model-sim/*`: fixed user-agent requests (one request per model/class)

## Model Simulation (No Body Editing)

- Open `track/model-sim` in Bruno and run whichever fixed request you want:
  - `post track event - GPTBot`
  - `post track event - ChatGPT-User`
  - `post track event - OAI-SearchBot`
  - `post track event - ClaudeBot`
  - `post track event - PerplexityBot`
  - `post track event - Meta-ExternalAgent`
  - `post track event - CCBot`
  - `post track event - Bytespider`
  - `post track event - Unknown Bot-like`
  - `post track event - Non-AI Browser`

## Bulk Simulation Script

1. Edit `bruno/track/scenarios/default.json`:
   - set `publishableKey` / `trackToken`, or use env vars (default file uses `${SB_PUBLISHABLE_KEY}` and `${TRACK_TOKEN}`)
   - optionally tune counts, `concurrency`, and `delayMs`
2. Dry run:
   - `npm run track:simulate:dry`
3. Fire all events:
   - `npm run track:simulate`
4. Use a different scenario file:
   - `node scripts/simulate-track-events.mjs bruno/track/scenarios/default.json`
5. Env vars supported by script:
   - publishable key: `SB_PUBLISHABLE_KEY` (also supports `SUPABASE_PUBLISHABLE_KEY`, `PUBLISHABLE_KEY`)
   - track token: `TRACK_TOKEN` (also supports `SITE_TRACKING_TOKEN`, `SEARCHABLE_TRACK_TOKEN`)

## Notes

The track requests need a real token from the `sites` table. If you have not inserted a site yet, the status request will still work but the event requests will fail with `Invalid tracking token`.
Use `tracking_token` for the install snippet and event ingestion. `verification_token` is reserved for domain ownership verification.
The local environment already includes the current local Supabase publishable key for the required auth headers.
The POST request also accepts a `userAgent` variable so you can test classification without changing browser headers.
