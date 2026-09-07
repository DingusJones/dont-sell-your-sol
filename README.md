# Dont sell your Sol

A read-only Solana ownership ledger built from the approved greenfield plan. React / TypeScript / Vite frontend, a same-origin Fetch API server boundary, strict normalized contracts, and conservative accounting. No signing, transactions, wallet connection, or provider keys in the client.

## Run locally

Node 22.12+ is required. Dependencies are pinned and locked.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Choose **Explore a demo** for the complete interactive synthetic ledger. Paste a real public address to exercise the API: without configured RPC, it honestly returns unavailable / unknown coverage.

```sh
npm run typecheck
npm test
npm run test:integration
npm run build
npm run test:e2e
```

This environment has npm, not pnpm; the approved gate names are provided as npm scripts. Playwright uses `/usr/bin/chromium` locally; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` or install its bundled Chromium on another machine. No global package installs are needed.

## Server-only RPC verification

Copy `.env.example` to `.env`, provide an HTTPS `SOLANA_RPC_URL`, and set `ENABLE_RPC=true` only for controlled verification. An optional independent `SOLANA_RPC_FALLBACK_URL` is supported. Vite loads these only into its server middleware. Do not use a `VITE_` prefix for secrets. Restart the dev server after changing bindings.

The RPC adapter implements `getBalance`, both token-program ownership reads, mainnet genesis validation, exact JSON numeric ingestion, account aggregation, field validation, size/time limits, and partial failures. Token-2022 public amounts remain explicitly partial because mint extensions and confidential balances are not fully decoded. Neither configured access nor synthetic test success establishes verified live coverage.

## Layout

- `apps/web`: responsive UI, wallet lifecycle, independent section queries, local display filters.
- `apps/api`: Fetch-compatible Worker entry, same-origin routes, bounded orchestration, cache, rate limits, security headers.
- `packages/domain`: runtime schemas, amounts, provenance, accounting, reconciliation, completeness.
- `packages/adapters`: read-only interfaces, capability gates, isolated Solana reader.
- `packages/links`: safe, expiring exact-link contract and empty verified registry.
- `tests/fixtures`: explicitly synthetic scenarios and RPC response shapes.
- `docs`: coverage, decisions, privacy, operations, verification evidence and remaining gates.

`npm run build` creates `dist/web` and `dist/api/worker.js`. Static production assets must be served with the API on the same origin; the Worker accepts an `ASSETS` binding. `npm run preview` provides a local preview with the same API middleware. Hosting and deployment have deliberately not been selected or performed.

No positive live protocol fixtures or rendered exact destinations were supplied. Native staking, LST enrichment, Jupiter protocol positions, Kamino, Save, Orca and later adapters remain unknown/unverified. All action links are disabled. Optional live token spot pricing is implemented; history remains unavailable. See [coverage](docs/coverage.md) and [implementation report](docs/implementation-report.md).

## Optional live token prices

Set `ENABLE_LIVE_PRICES=true` and supply `JUPITER_API_KEY` in server-only environment bindings (also supported by local Vite middleware). The key is optional configuration; without it or the flag, token prices remain null with explicit status/warnings. Never prefix it with `VITE_` or commit secrets.

The server calls [Jupiter Price V3](https://developers.jup.ag/docs/price) at `https://api.jup.ag/price/v3`, batching up to 50 unique mint IDs after real RPC balances are normalized. Native SOL retains `native:SOL` identity and uses wrapped SOL mint `So11111111111111111111111111111111111111112` only for pricing. SPL and Token-2022 use their mint keys. USD balance estimates use decimal.js and normalized balance decimals; mismatched price decimals are rejected.

Price provenance includes source, estimated/unknown confidence, price slot, fetched time, null observation time (V3 provides no observation timestamp), cache age, freshness, provider decimals and optional 24h market price change. `createdAt` is not treated as price observation time. Cache TTL is 30 seconds; prices more than 150 slots behind the ownership snapshot are rejected. This slot policy is a conservative application heuristic, not proof of current market freshness. Missing, stale, malformed, rate-limited and failed prices stay null with warnings. No stale price fallback is used.

This enables live spot estimates when configured, not verified production coverage. Tests use synthetic responses; browser demos remain entirely synthetic. Protocol APY, health, PnL/cost basis/history, exact withdrawals and protocol position discovery remain unavailable. Token-2022 restrictions remain partial even with a price. Market price change is not wallet PnL.
