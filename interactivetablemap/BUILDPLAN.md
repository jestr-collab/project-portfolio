# Apollo credit conservation (cron enrich)

## Goals

1. **7-day company cooldown** — Skip companies whose `companies.updated_at` is within the last 7 days (treat as “recently enriched”).
2. **Signal score gate** — Only run contact reveal for signals with `score >= 70`; skip lower scores entirely (no Apollo calls for those).
3. **Daily reveal cap** — Stop after **50** contact reveals in the current UTC day.
4. **Logging** — `console.log` lines:
   - `[enrich] Skipping {company} — enriched {N} days ago`
   - `[enrich] Daily cap reached — stopping enrichment`

## Schema assumptions (adjust in `route.ts` if yours differ)

- `companies`: at least `id`, `name`, `updated_at` (last enrichment touch).
- `signals`: at least `id`, `company_id`, `score` (and whatever you join for enrichment).
- **Daily cap accounting**: table `enrichment_contact_reveals` with `id`, `created_at` (one row per successful contact reveal).  
  If you use another table, change `REVEALS_TABLE` / `logContactReveal` in `app/api/cron/enrich/route.ts`.

## Cron

- Vercel Cron or similar should `GET` or `POST` this route with your existing auth (e.g. `CRON_SECRET`).
