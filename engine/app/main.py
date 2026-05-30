from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.agents import AGENTS
from app.agents.hunab_ku import HunabKuMonitor
from app.config import get_settings
from app.core.pipeline import Pipeline
from app.core.risk import CircuitBreaker
from app.core.wallet import Wallet
from app.db.supabase_repo import SupabaseRepo
from app.state import state


settings = get_settings()
repo = SupabaseRepo(settings)
wallet = Wallet.initial(settings.exchanges, settings.start_balance_usdt, settings.start_balance_btc)
breaker = CircuitBreaker(settings.max_drawdown_pct)
pipeline = Pipeline(settings, state, wallet, repo, breaker)
monitor = HunabKuMonitor(settings)
_monitor_task: asyncio.Task | None = None


async def _monitor_loop() -> None:
    interval = settings.poll_interval_ms / 1000
    while state.running:
        books = await monitor.fetch_all()
        state.books = books
        for ex, snap in books.items():
            if snap.error:
                state.exchange_errors[ex] = snap.error
            elif ex in state.exchange_errors:
                del state.exchange_errors[ex]
        await pipeline.run(books)
        await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _monitor_task
    state.running = True
    _monitor_task = asyncio.create_task(_monitor_loop())
    yield
    state.running = False
    if _monitor_task:
        _monitor_task.cancel()
        try:
            await _monitor_task
        except asyncio.CancelledError:
            pass
    await monitor.close()


app = FastAPI(title="Ppolom Engine", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "supabase": repo.enabled, "running": state.running}


@app.get("/agents")
async def agents():
    return AGENTS


@app.get("/state")
async def get_state():
    return {
        **state.summary(),
        "wallet": wallet.snapshot(),
        "supabase_connected": repo.enabled,
    }


@app.get("/opportunities")
async def opportunities():
    return repo.recent_opportunities()


@app.get("/trades")
async def trades():
    return repo.recent_trades()


@app.get("/trace-events")
async def trace_events(limit: int = 100):
    lim = max(1, min(limit, 500))
    rows = repo.recent_trace_events(lim)
    return list(reversed(rows))


@app.get("/demo/sessions")
async def demo_sessions():
    return repo.list_demo_sessions()


@app.get("/demo/sessions/{slug}")
async def demo_session(slug: str):
    session = repo.get_demo_session(slug)
    if not session:
        return {"error": "not_found"}
    traces = repo.get_demo_traces(session["id"])
    return {"session": session, "events": traces}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    state.ws_subscribers.append(q)
    try:
        # send snapshot
        await ws.send_json({"type": "snapshot", "data": state.summary()})
        while True:
            msg = await q.get()
            await ws.send_json({"type": "trace", "data": msg})
    except WebSocketDisconnect:
        pass
    finally:
        if q in state.ws_subscribers:
            state.ws_subscribers.remove(q)
