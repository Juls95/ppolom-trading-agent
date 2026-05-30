from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.agents import AGENTS
from app.agents.hunab_ku import HunabKuMonitor
from app.config import get_settings
from app.core.demo_accounts import DemoAccountStore
from app.core.exchange_factory import SUPPORTED_DEMO_EXCHANGES
from app.core.pipeline import Pipeline
from app.core.risk import CircuitBreaker
from app.core.wallet import Wallet
from app.db.supabase_repo import SupabaseRepo
from app.state import state


settings = get_settings()
repo = SupabaseRepo(settings)
demo_store = DemoAccountStore(settings)
wallet = Wallet.initial(settings.exchanges, settings.start_balance_usdt, settings.start_balance_btc)
breaker = CircuitBreaker(settings.max_drawdown_pct)
pipeline = Pipeline(settings, state, wallet, repo, breaker, demo_store)
monitor = HunabKuMonitor(settings)
_monitor_task: asyncio.Task | None = None


class DemoConnectBody(BaseModel):
    exchange: str = Field(..., description="okx | bybit")
    api_key: str
    api_secret: str
    passphrase: str | None = None
    label: str = "user"


class DemoSessionBody(BaseModel):
    session_id: str | None = None


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


def _resolve_session(session_id: str | None, x_demo_session: str | None) -> str:
    return session_id or x_demo_session or demo_store.create_session()


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
    await demo_store.close_all()


app = FastAPI(title="Ppolom Engine", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "supabase": repo.enabled,
        "running": state.running,
        "demo_trade_enabled": settings.demo_trade_enabled,
        "exchanges": settings.exchanges,
    }


@app.get("/agents")
async def agents():
    return AGENTS


@app.get("/state")
async def get_state():
    demo_balances: dict[str, Any] = {}
    for ex in settings.exchanges:
        cred = demo_store.resolve_credential(ex)
        if cred:
            demo_balances[ex] = {
                "label": cred.label,
                "balances": cred.last_balances,
                "error": cred.last_error,
            }
    return {
        **state.summary(),
        "wallet": wallet.snapshot(),
        "demo_balances": demo_balances,
        "supabase_connected": repo.enabled,
        "demo_trade_enabled": settings.demo_trade_enabled,
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


@app.get("/demo/supported-exchanges")
async def demo_supported_exchanges():
    return SUPPORTED_DEMO_EXCHANGES


@app.post("/demo/session")
async def demo_create_session():
    sid = demo_store.create_session()
    return {"session_id": sid}


@app.get("/demo/accounts")
async def demo_list_accounts(
    session_id: str | None = None,
    x_demo_session: str | None = Header(default=None, alias="X-Demo-Session"),
):
    sid = _resolve_session(session_id, x_demo_session)
    return {"session_id": sid, "accounts": demo_store.list_accounts(sid)}


@app.post("/demo/connect")
async def demo_connect(
    body: DemoConnectBody,
    session_id: str | None = None,
    x_demo_session: str | None = Header(default=None, alias="X-Demo-Session"),
):
    sid = _resolve_session(session_id, x_demo_session)
    ex = body.exchange.lower()
    if ex not in SUPPORTED_DEMO_EXCHANGES:
        raise HTTPException(400, f"Exchange no soportado. Usa: {list(SUPPORTED_DEMO_EXCHANGES)}")
    try:
        balances = await demo_store.validate_and_connect(
            sid, ex, body.api_key, body.api_secret, body.passphrase, body.label
        )
    except Exception as exc:
        raise HTTPException(400, f"No se pudo conectar: {exc}") from exc
    return {"session_id": sid, "exchange": ex, "balances": balances}


@app.post("/demo/disconnect")
async def demo_disconnect(
    exchange: str,
    session_id: str | None = None,
    x_demo_session: str | None = Header(default=None, alias="X-Demo-Session"),
):
    sid = _resolve_session(session_id, x_demo_session)
    demo_store.disconnect(sid, exchange.lower())
    return {"ok": True}


@app.get("/demo/balances")
async def demo_balances(
    session_id: str | None = None,
    x_demo_session: str | None = Header(default=None, alias="X-Demo-Session"),
):
    sid = _resolve_session(session_id, x_demo_session)
    out: dict[str, Any] = {}
    for ex in settings.exchanges:
        if ex not in SUPPORTED_DEMO_EXCHANGES:
            continue
        cred = demo_store.get_credential(sid, ex) or demo_store.resolve_credential(ex)
        if not cred:
            continue
        try:
            out[ex] = await demo_store.fetch_balances_for_cred(cred)
        except Exception as exc:
            out[ex] = {"error": str(exc)}
    return {"session_id": sid, "balances": out}


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
        await ws.send_json({"type": "snapshot", "data": state.summary()})
        while True:
            msg = await q.get()
            await ws.send_json({"type": "trace", "data": msg})
    except WebSocketDisconnect:
        pass
    finally:
        if q in state.ws_subscribers:
            state.ws_subscribers.remove(q)
