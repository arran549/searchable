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

## Requests

- `track status`: smoke test for function routing and env presence
- `post track event`: sends a JSON tracking event
- `pixel track`: hits the GIF pixel endpoint

## Notes

The track requests need a real token from the `sites` table. If you have not inserted a site yet, the status request will still work but the event requests will fail with `Invalid tracking token`.
Use `tracking_token` for the install snippet and event ingestion. `verification_token` is reserved for domain ownership verification.
The local environment already includes the current local Supabase publishable key for the required auth headers.
