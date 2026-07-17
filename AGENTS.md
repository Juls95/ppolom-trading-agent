# AGENTS.md

## Cursor Cloud specific instructions

Ppolom is a two-service monorepo for a BTC/USDT cross-exchange arbitrage demo:

- **`engine/`** — FastAPI (Python 3.12) service on port `8000`. Polls real order books via CCXT, runs the deterministic 6-agent "Maya council" pipeline, streams deliberation over `ws://localhost:8000/ws`, and (optionally) persists to Supabase. Standard run/test commands are in `README.md` (§3, §6).
- **`web/`** — Next.js 14 (pnpm) app on port `3000`. Dashboard/council/demo UI. Standard commands are in `web/package.json` scripts.

### Running the services (dev)

- Engine: from `engine/`, `source .venv/bin/activate && PYTHONPATH=. uvicorn app.main:app --reload --port 8000`. `PYTHONPATH=.` is required.
- Web: from `web/`, `pnpm dev`. It reads `NEXT_PUBLIC_ENGINE_URL`/`NEXT_PUBLIC_ENGINE_WS` (defaults `http://localhost:8000` / `ws://localhost:8000/ws`), so no web env file is needed for local dev.

### Non-obvious env / config caveats

- **Do not copy `.env.example` verbatim.** Two entries break a clean local run:
  - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` placeholders make the repo "enabled" but point at a non-resolvable host, so `/trades`, `/opportunities`, `/trace-events`, and `/demo/verify` return `500` (surfaces in the UI as "Engine no disponible — Failed to fetch"). Leave all `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` **blank** for local dev — the engine no-ops persistence and the web falls back to the engine's live WebSocket stream. Live deliberation + metrics still work; only historical/persisted tables and the `/demo` replay pages need a real Supabase.
  - `BYBIT_PUBLIC_USE_TESTNET=` (empty) crashes engine startup — the field is `bool | None` and pydantic rejects an empty string. It must be `true`, `false`, or the line removed entirely.
- **Exchange geo-blocks from the cloud VM:** Bybit (`api.bybit.com` and `api-testnet.bybit.com` → CloudFront 403) and Binance (`api.binance.com` → 451) are blocked from this VM's region. OKX and Kraken are reachable. Use `EXCHANGE_A=okx`, `EXCHANGE_B=kraken`, `EXCHANGE_C=kraken` locally so the pipeline has two working exchanges to compare; the default `okx`/`bybit` pair leaves only one live book and produces no opportunities.
- A local `.env` at repo root (gitignored) is what makes the above work; the engine reads `.env`/`../.env`.

### Gotchas

- `pnpm lint` (`next lint`) is **not runnable non-interactively**: no ESLint config is committed, so it drops into an interactive "How would you like to configure ESLint?" prompt. Type checking still runs as part of `pnpm build`.
- The engine's graceful shutdown can hang on "Waiting for background tasks to complete" if a request is mid-flight against an unreachable Supabase; send a second `Ctrl+C` to force-quit before restarting.
- Most detected opportunities are **rejected** by the cost agent (Chaac) — this is intended "restraint-first" behavior, not a bug. `trades` staying at 0 with `opportunities_count` climbing is the expected healthy state without demo CEX keys.
