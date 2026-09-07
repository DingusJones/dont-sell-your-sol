# Implementation verification — 2026-09-07

Scope: `/home/jay/Projects/dont-sell-your-sol` only. The approved plan was read from `/home/jay/.hermes/cache/delegation/subagent-summary-0-20260906_143732_435529.txt`. The repository already contained an untracked greenfield foundation when this session began; it was inspected, extended and verified, not authored entirely during this session.

## Working foundation

React/TypeScript/Vite ownership ledger; public-key validation and optional local remembering; separate wallet-scoped section queries; Zod normalized wire contracts; exact atomic ingestion and decimal arithmetic; provider interfaces and isolated RPC transport/normalization; mainnet checks; bounded server requests; short-lived cache, deduplication, circuit and rate controls; scoped completeness; receipt/position reconciliation; explicit liabilities/rewards/locks; safe unresolved-link behavior; responsive dark CSS and semantic disclosures.

This session added `apps/web/src/features/portfolio/selectors.ts`, `tests/unit/regressions.test.ts`, and `scripts/inspect-artifact.mjs`; updated `App.tsx`, `reconcile.ts`, `completeness.ts`, and `tests/fixtures/scenarios.ts`; and added this report. Section merging now preserves the oldest observation and marks retained responses stale after failed refreshes. Position sorting applies the selected sort. Combining token accounts invalidates an unproven aggregated USD value. Coverage cannot be complete with unresolved accounting, and unknown debt is separate from missing prices.

The demo catalogue exposes SOL-only, SPL/Token-2022, spam/unverified, lending supply/borrow, LP/vault, rewards, overlapping providers, provider failure, total outage, stale, missing exact links, empty, unknown, loading, negative value, malicious metadata and incomplete pagination. All amounts, prices and protocol examples are synthetic.

## Commands and evidence

- `npm ci`: attempted; esbuild postinstall failed with sandbox `spawnSync ... EPERM`.
- `npm ci --offline --cache /home/jay/.npm --ignore-scripts --no-audit --no-fund`: passed, 63 packages installed from cached dependencies. No dependency versions changed. Subsequent build exercised esbuild successfully.
- `npm run typecheck`: passed.
- `npm test`: passed, 36 tests in 6 files (domain, regressions, adapter, integration and security).
- `npm run build`: passed; generated browser HTML/CSS/JS and `dist/api/worker.js`.
- `npm run test:e2e`: attempted; configured web server could not start. Direct `npm run dev` isolated the sandbox failure: `listen EPERM 127.0.0.1:5173`.
- `node scripts/inspect-artifact.mjs`: attempted server-free browser artifact checks; Chromium terminated on sandbox `setsockopt: Operation not permitted`. No current browser pass or screenshot is claimed. This script can run after a build in an environment permitting Chromium.

Build sizes at verification: browser JS 371.30 kB (114.72 kB gzip), CSS 16.63 kB (4.12 kB gzip), Worker approximately 625.3 kB. Generated assets are ignored, not committed source. Existing screenshots/test artifacts are not evidence for this revision.

## Release limitations

No provider credentials or positive live protocol fixtures were supplied. RPC code is implemented and tested with synthetic responses, disabled by default. Native staking discovery, authenticated/native protocol decoders, current LST registries, live pricing/history, and exact action links are not activated. Jupiter/Kamino/Save/Orca examples prove UI and domain behavior only. The exact-link registry stays empty. Missing coverage is unknown/unavailable, not a fabricated empty balance.

Real browser, accessibility, mobile-device, positive-wallet comparison, external destination, provider terms and operational deployment checks remain release gates. No commit, push, deployment, secret, Hermes configuration change or other-repository modification was performed.

Final verification: `npm run test:integration` passed all 10 API integration tests. Direct inspection of generated `dist/web/index.html` and its assets passed the app-root and server-configuration-name checks. Importing the generated Worker passed health (200) and unconfigured portfolio (503 with null data) checks. These checks do not substitute for browser rendering or a comprehensive secret audit.

`git diff --check`, `git diff --stat`, `git diff --cached --stat`, and `git status --short` were inspected. All project source remains untracked, as at the start; tracked/staged diffs are empty. No staging or commit was performed. Consequently, git diff alone does not enumerate this implementation; use the working-tree source inventory and this report.
