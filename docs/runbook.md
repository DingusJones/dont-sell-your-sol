# Local operation and release gates

Use `npm ci`, `npm run dev`, and the gates in README. Build outputs are `dist/web` and a Fetch-compatible `dist/api/worker.js`. The Worker expects optional server bindings `SOLANA_RPC_URL`, `SOLANA_RPC_FALLBACK_URL`, `ENABLE_RPC`, `ENABLE_LIVE_PRICES`, `JUPITER_API_KEY`, and an `ASSETS.fetch` static binding. No deployment config or automatic deploy workflow is included.

API routes: portfolio overview and allowed `core`/`defi` section POSTs; wallet-owned position detail POST (404 until ownership verified); GET coverage, sanitized configured provider status, registered assets (404 when absent) and application health. Request schema is strict. All ownership requests are read-only.

Limits: JSON request body 2 KiB; RPC response 4 MB; token response max 10,000 accounts; 8-second per-request timeout and 20-second adapter deadline; max 8 active app requests; 60 requests/IP/minute and 12/address/minute per process; 200 cached snapshots with 30-second fresh/5-minute retention. Three repeated adapter failures open a 30-second local circuit. Repeated requests for the same key coalesce. No retries on a nonexistent protocol route. Configure independent fallback RPC only if approved.

Rate controls are in-memory per instance. Production needs an edge/distributed budget to enforce global provider quotas and trusted proxy-IP handling; Vite local middleware is not a production server. Review provider terms, observability without raw wallets, cache policy, secret rotation, CSP/static headers, SDK/runtime limits and origin bindings before launch.

Kill switches: leave `ENABLE_RPC=false` for unavailable live balances. All protocol gates are closed. The exact-link registry starts empty. Metadata images remain unregistered. No feature needs signing.

Stale behavior: original source time persists. Complete last-good core snapshots are retained after a refresh error, visibly stale; failed snapshots never become a $0 success. Partial successful data is displayed but does not replace a complete last-good cached result. The browser keeps prior query data after transport failure. Values with incomplete debts are not lower bounds.

Release checklist: positive live fixtures and native comparisons, exact rendered destinations, provider terms and budgets, deployed runtime integration, distributed throttling, manual screen reader/zoom/touch, independent security/dependency audit, operational monitoring and rollback rehearsal. None of these unexecuted deployment checks is claimed complete.

## Jupiter spot pricing

Provision `JUPITER_API_KEY` through server secret bindings; local `.env` is ignored. Set `ENABLE_LIVE_PRICES=true` and restart the server. Both bindings are required; unset either to disable pricing. No key or upstream error body is returned to the browser. The only price endpoint is `https://api.jup.ag/price/v3` with server-side `x-api-key`; redirects are rejected.

Requests batch 50 unique mint IDs sequentially with an 8-second timeout per batch and 256 KiB response limit. The per-instance cache holds at most 2,000 quotes for 30 seconds. Expired quotes are removed, never used as fallback. Ownership snapshots are cached separately and re-enriched on reads. Rate limiting (429), missing mints, malformed bodies/entries, decimal mismatches, and unavailable upstreams leave null values and explicit token warnings/provider status. Inspect `jupiter-price-v3` and `token-prices` status; do not log headers or keys. Global quotas still require distributed controls.

`price.freshness.observedAt` is null; V3 supplies a block ID, not an observation timestamp. Fetch age and a maximum lag of 150 slots behind normalized ownership determine local freshness. Source `createdAt` is not a price timestamp. Price decimals and 24h percentage change are retained separately from ownership decimals. Confidence is estimated, never verified. Spot pricing does not enable protocol APY, health, PnL, exact withdrawal proceeds or discovery. Nonempty Token-2022 coverage stays partial. Demos and automated price responses are synthetic; credentialed live verification remains outstanding.
