# Ppolom

**Seis agentes mayas debaten cada oportunidad de arbitraje BTC/USDT antes de simular la ejecución.**

Live demo · [Consejo](/council) · [Demo](/demo) · [Dashboard](/dashboard) · [Metodología](/methodology)

> **Paper mode only.** Order books reales vía CCXT (Binance, OKX, Kraken). Ejecución simulada. Demo en tablas `demo_*` claramente etiquetadas, separadas de `live_*` en Supabase.

---

## Qué es (60 segundos)

Ppolom es un bot de arbitraje cross-exchange donde **seis agentes** — Hunab Ku, Itzamná, Chaac, Ixchel, Kukulkán y Kinich Ahau — evalúan cada divergencia de precio. Solo cuando **todos votan positivo** se simula la operación. La mayoría de divergencias reales se rechazan por fees: eso es correcto (restraint-first).

| Agente | Rol |
|--------|-----|
| **Hunab Ku** | Monitoreo order books (CCXT) |
| **Itzamná** | Detección ask &lt; bid |
| **Chaac** | Costos netos (fees + slippage + retiro) |
| **Ixchel** | Liquidez parcial + wallets |
| **Kukulkán** | Ejecución simulada |
| **Kinich Ahau** | Registro Supabase + métricas |

---

## Arquitectura

```
┌─────────────────┐     REST/WS      ┌──────────────────┐
│  Next.js (web)  │ ◄──────────────► │ FastAPI (engine) │
│  Fly.io :3000   │                  │ Fly.io :8000     │
└────────┬────────┘                  └────────┬─────────┘
         │                                    │
         │         Supabase                   │ CCXT
         └──────────────┬─────────────────────┘
                        │
              live_*  (datos reales)
              demo_*  (simulados, etiquetados)
```

**Stack:** Python 3.12 · FastAPI · CCXT · Next.js 14 · Supabase · Fly.io · Tailwind

**Exchanges:** Binance · OKX · Kraken (3 vías para maximizar divergencias reales)

---

## Quick start

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta `supabase/migrations/001_initial.sql` en el SQL Editor
3. Copia URL + keys a `.env`

### 2. Variables de entorno

```bash
cp .env.example .env
# Edita SUPABASE_* y opcionalmente GEMINI_API_KEY
```

### 3. Engine

```bash
cd engine
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

> Usa Python **3.12** (3.14 no compila pydantic-core localmente). En producción Fly usa la imagen `python:3.12-slim`.

### 4. Seed demo (tablas demo_* separadas)

```bash
cd engine
PYTHONPATH=. python scripts/seed_demo.py
```

### 5. Web

Run this in an isolated Dev Container / Docker / separate folder first.

```bash
cd web
pnpm install
pnpm dev
# http://localhost:3000
```

### 6. Tests

```bash
cd engine && PYTHONPATH=. pytest tests/
cd web && pnpm test
```

---

## Deploy Fly.io

```bash
# Engine
cd engine && fly launch --no-deploy
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
fly deploy

# Web
cd web && fly launch --no-deploy
fly secrets set NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=...
fly secrets set NEXT_PUBLIC_ENGINE_URL=https://ppolom-engine.fly.dev
fly secrets set NEXT_PUBLIC_ENGINE_WS=wss://ppolom-engine.fly.dev/ws
fly deploy
```

---

## Separación demo vs live

| Tabla | Contenido | UI |
|-------|-----------|-----|
| `live_*` | Pipeline real CCXT | `/dashboard` badge LIVE |
| `demo_*` | Escenarios seed simulados | `/demo` badge DEMO |

Los datos demo tienen `badge_label = "DEMO · Datos simulados"` y `is_demo = true`. Nunca se insertan en tablas `live_*`.

---

## Decisiones técnicas

- **CCXT REST polling** (500ms) en lugar de ccxt.pro WS para MVP estable en Fly.io; latencia real medida y mostrada.
- **3 exchanges** (A+B restricción del usuario): Binance + OKX + Kraken para más pares de comparación.
- **Supabase** en lugar de SQLite: persistencia compartida web+engine, RLS lectura pública.
- **Deterministic pipeline**: LLM narration opcional (`LLM_NARRATION_ENABLED=false` default).
- **Seguridad deps**: versiones exactas, `.npmrc` con `ignore-scripts=true`, `images.unoptimized` (sin sharp postinstall).

---

## Licencia

MIT
