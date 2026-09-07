# Implementation decisions

Approved scope: new repository only, read-only, no commit/push/deploy/Hermes configuration edits. Plan source: `/home/jay/.hermes/cache/delegation/subagent-summary-0-20260906_143732_435529.txt`, read in full on 2026-09-06. Its Wallaby audit is background evidence; no Wallaby files were read or modified during implementation.

Defaults adopted: paste-only, free-first, one watched address, session-only identity unless explicit remember checkbox, manual and 60-second visible-tab refresh, no historical PnL, rewards excluded from headline. Production hosting and paid services are deferred.

One npm package orchestrates the planned `apps/` and `packages/` boundaries. Workspaces are not separately published. npm replaces pnpm because pnpm is not installed. Fetch-compatible Worker/serverless API plus Vite middleware gives an actual runnable same-origin artifact without deployment credentials.

RPC JSON requests are isolated behind a read-only adapter rather than pulling in a full Solana SDK. Base58 decoded-length validation uses BigInt; no on-curve restriction. Exact JSON ingestion retains numeric lexemes; raw amounts use BigInt and values use decimal.js. Deterministic generated tests cover u64 arithmetic. No synthetic native protocol implementation is presented as live integration.

Local npm registry access failed with EAI_AGAIN. Pinned dependencies were selected from existing cached public package tarballs. Missing cache metadata was reconstructed from those package manifests in `/tmp`, without modifying the source cache or any other repository. Optional axe and fast-check packages were unavailable; deterministic property tests and native browser checks are used, with axe/screen-reader gaps documented.

Provider-specific directories are created only when there is actual code to verify. Deferred protocols are explicit entries in a versioned capability manifest, not nonfunctional adapter shells. Positive fixtures, authenticated access, deployment/program mapping and exact-link verification remain release gates.
