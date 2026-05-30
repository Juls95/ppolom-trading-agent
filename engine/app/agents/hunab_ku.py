from __future__ import annotations

import asyncio
import time
from typing import Any

import ccxt.async_support as ccxt

from app.config import Settings
from app.events import OrderBookSnapshot


class HunabKuMonitor:
    """Real-time order book monitor via CCXT REST (polling) with error tracking."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._clients: dict[str, ccxt.Exchange] = {}

    def _make_exchange(self, exchange_id: str) -> ccxt.Exchange:
        klass = getattr(ccxt, exchange_id)
        ex = klass({"enableRateLimit": True})
        if self.settings.use_sandbox and hasattr(ex, "set_sandbox_mode"):
            ex.set_sandbox_mode(True)
        return ex

    async def _fetch_book(self, exchange_id: str) -> OrderBookSnapshot:
        start = time.perf_counter()
        ex = self._clients.get(exchange_id)
        if ex is None:
            ex = self._make_exchange(exchange_id)
            self._clients[exchange_id] = ex
        try:
            book = await ex.fetch_order_book(self.settings.symbol, limit=10)
            latency = int((time.perf_counter() - start) * 1000)
            bids = book.get("bids") or [[0, 0]]
            asks = book.get("asks") or [[0, 0]]
            return OrderBookSnapshot(
                exchange=exchange_id,
                symbol=self.settings.symbol,
                best_bid=float(bids[0][0]),
                best_ask=float(asks[0][0]),
                bid_volume=float(bids[0][1]),
                ask_volume=float(asks[0][1]),
                latency_ms=latency,
                bids=[[float(b[0]), float(b[1])] for b in bids[:10]],
                asks=[[float(a[0]), float(a[1])] for a in asks[:10]],
            )
        except Exception as exc:
            latency = int((time.perf_counter() - start) * 1000)
            return OrderBookSnapshot(
                exchange=exchange_id,
                symbol=self.settings.symbol,
                best_bid=0,
                best_ask=0,
                bid_volume=0,
                ask_volume=0,
                latency_ms=latency,
                error=f"{type(exc).__name__}: {exc}",
            )

    async def fetch_all(self) -> dict[str, OrderBookSnapshot]:
        tasks = [self._fetch_book(ex) for ex in self.settings.exchanges]
        results = await asyncio.gather(*tasks)
        return {r.exchange: r for r in results}

    async def close(self) -> None:
        for ex in self._clients.values():
            await ex.close()
