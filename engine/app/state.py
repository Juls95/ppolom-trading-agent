from __future__ import annotations

import asyncio
from collections import deque
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID, uuid4

from app.events import OrderBookSnapshot, TraceEvent


@dataclass
class EngineState:
    session_id: UUID = field(default_factory=uuid4)
    books: dict[str, OrderBookSnapshot] = field(default_factory=dict)
    exchange_errors: dict[str, str] = field(default_factory=dict)
    trace_buffer: deque[TraceEvent] = field(default_factory=lambda: deque(maxlen=500))
    ws_subscribers: list[asyncio.Queue] = field(default_factory=list)
    running: bool = False
    total_pnl: float = 0.0
    trades_count: int = 0
    opportunities_count: int = 0
    max_drawdown: float = 0.0
    peak_pnl: float = 0.0
    last_pipeline_at: str | None = None

    def publish(self, event: TraceEvent) -> None:
        self.trace_buffer.append(event)
        for q in list(self.ws_subscribers):
            try:
                q.put_nowait(event.model_dump(mode="json"))
            except asyncio.QueueFull:
                pass

    def summary(self) -> dict[str, Any]:
        return {
            "session_id": str(self.session_id),
            "running": self.running,
            "books": {k: v.model_dump(mode="json") for k, v in self.books.items()},
            "exchange_errors": self.exchange_errors,
            "total_pnl": self.total_pnl,
            "trades_count": self.trades_count,
            "opportunities_count": self.opportunities_count,
            "max_drawdown": self.max_drawdown,
            "last_pipeline_at": self.last_pipeline_at,
        }


state = EngineState()
