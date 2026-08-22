# ToyotaSureHub V12 RC1 fixes

## Included
- Toyota Sure checklist fields are persisted in `cars.metadata` so Edit Car restores the checkbox state.
- Facebook Campaign creation is awaited before queue jobs use `campaign.id`.
- OpenAI browser-direct fetch was removed. AI now calls the authenticated Supabase Edge Function `generate-ai`.
- Edge Function source is included at `supabase/functions/generate-ai/index.ts`.

## Required Supabase setup
The Edge Function expects the Supabase project secret:

`OPENAI_API_KEY`

Set this in Supabase Edge Function secrets. Do not put the OpenAI secret in the Vite frontend environment.
