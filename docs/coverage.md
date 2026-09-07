# Coverage manifest 2026-09-06.1

No live provider coverage is verified in this implementation.

| Capability | Implementation | Enabled by default | Evidence |
|---|---|---|---|
| Native SOL | Exact lamport RPC ingestion, slot, mainnet validation | No | Synthetic positive/empty/error contracts |
| SPL Token | Owner accounts, mint/program identity, raw amounts, aggregation, freeze/delegate state | No | Synthetic contracts |
| Token-2022 | Public account amounts and retained account extensions; always partial for nonempty results | No | Synthetic contracts; mint extension decoding unavailable |
| Native stake | Typed authorities, activation, lock and withdrawal model + synthetic UI | No | Positive authority discovery missing |
| LST / Jito / Marinade | Receipt relationship accounting + synthetic staking views | No | Current mint/pool/ticket registry missing |
| Jupiter / Kamino / Save | Typed lending/lock/position model and explicit capability gates | No | Positive product reports and deployment evidence missing |
| Orca | LP NFT/pool/range/custody/fees/rewards model + synthetic UI | No | Positive position fixtures missing |
| CoinStats | Paid broad-discovery gate | No | Entitlement, budget and positive Solana data absent |
| Meteora / Raydium / Sanctum / Drift / Marginfi | Explicit unknown coverage | No | Product/version/access verification required |
| Token spot prices | Optional server-side Jupiter Price V3 after normalized ownership; 50-mint batches, validated metadata, decimal.js valuation, 30-second cache, explicit null failures | No | Synthetic adapter and integration tests; no credentialed live verification |
| PnL / APY / health / exact withdrawals | Unavailable; token spot prices do not establish these metrics | No | Protocol/history evidence missing |
| Exact protocol destinations | Versioned registry and strict resolver | No | Registry intentionally empty |

`GET /api/v1/coverage` is the machine-readable manifest. “Complete” means successful checks and completed pages in the named scope only. A core-only empty response cannot prove no staking or DeFi. HTTP 200 plus no usable protocol evidence remains unknown. Unsupported Token-2022 accounts qualify the entire token scope rather than disappearing silently.

Demo scenarios are synthetic, visibly labeled and generated entirely in the browser. They are not positive protocol fixtures. A sample protocol name is illustrative, not proof of integration.

## Evidence required to enable a protocol

Record public wallet consent/provenance; exact mainnet program/version; positive account identities and amounts; observed slot/time; decoded assets, liabilities, rewards, custody and locks; explicit indexed/fetcher/pagination reports; empty and failure paths; source terms; adapter contract tests; independent chain/native comparison. Scope each product separately. Never enable a route solely because it returns an HTML shell.

For a destination, record the official domain, route, expected entity/network, rendered entity screenshot, direct-navigation result, wallet/action context, redirect behavior, closed/wrong-version tests, verification time and expiry. Until then no action URL is emitted.

Live pricing requires both `ENABLE_LIVE_PRICES=true` and server-only `JUPITER_API_KEY`. Coverage/status endpoints report configuration, not proven accuracy. Native SOL uses the wrapped SOL pricing mint without changing its ownership identity; SPL/Token-2022 retain mint/program/account identities. Unknown prices never become zero. Quote metadata preserves source, confidence, decimals, 24h percentage change, slot and fetch/cache freshness; observation time is null because V3 does not supply it. A 150-slot lag limit against ownership and 30-second fetch TTL qualify freshness; neither establishes exact trade time. Demo fixtures remain synthetic.
