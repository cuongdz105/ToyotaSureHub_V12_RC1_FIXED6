# ToyotaSureHub V12 Architecture

## Data rule

- Supabase is the source of truth for business data.
- A single in-memory `appDataStore` is shared by the application.
- React components read the same store; they do not create per-page business caches.
- LocalStorage is retained only for non-critical UI/AI-memory/rate-controller preferences and drafts where appropriate.
- No page or business service may treat LocalStorage as a second source of truth.
- SessionStorage is not used for business workflow state; transient car/group/account context is passed through React Router state.

## Supabase business tables

- `cars`
- `car_images`
- `facebook_accounts`
- `facebook_groups`
- `facebook_campaigns`
- `facebook_queue`
- `customers`
- `ai_history`
- `settings`

## Cars flow

`Supabase -> carSupabaseService -> appDataStore -> useCars()/services -> UI`

Car images are stored in the `car-images` Storage bucket and indexed in `car_images`.

## Facebook flow

`Cars -> Facebook Post -> Groups -> Campaign -> Queue`

The selected car is passed through React Router state and the transient posting session is kept in memory only.

## AI History

AI history is stored in Supabase with a default retention period of 90 days.
