from __future__ import annotations

import time
from typing import Any

from app.config import Settings
from app.core.demo_accounts import DemoAccountStore
from app.events import Opportunity


async def try_demo_execution(
    opp: Opportunity,
    qty: float,
    store: DemoAccountStore,
    settings: Settings,
) -> dict[str, Any] | None:
    if not settings.demo_trade_enabled:
        return None

    buy_cred = store.resolve_credential(opp.buy_exchange)
    sell_cred = store.resolve_credential(opp.sell_exchange)
    if not buy_cred or not sell_cred:
        return None

    symbol = settings.symbol
    min_qty = max(qty, settings.demo_min_qty_btc)
    start = time.perf_counter()

    buy_ex = await store.get_client(buy_cred)
    sell_ex = await store.get_client(sell_cred)

    buy_order = await buy_ex.create_order(symbol, "market", "buy", min_qty)
    sell_order = await sell_ex.create_order(symbol, "market", "sell", min_qty)
    latency = int((time.perf_counter() - start) * 1000)

    await store.fetch_balances_for_cred(buy_cred)
    await store.fetch_balances_for_cred(sell_cred)

    return {
        "execution_mode": "demo_cex",
        "buy_order_id": buy_order.get("id"),
        "sell_order_id": sell_order.get("id"),
        "buy_status": buy_order.get("status"),
        "sell_status": sell_order.get("status"),
        "qty_btc": min_qty,
        "latency_ms": latency,
        "note": "Órdenes demo OKX + Bybit vía CCXT",
    }
