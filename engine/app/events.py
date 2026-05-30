from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Decision(str, Enum):
    EXECUTE = "EXECUTE"
    REJECT = "REJECT"
    NO_ACTION = "NO_ACTION"
    PARTIAL = "PARTIAL"
    PAUSED = "PAUSED"


class TraceEvent(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    agent_id: str
    agent_name: str
    event_type: str
    vote: bool | None = None
    message: str
    payload: dict[str, Any] = Field(default_factory=dict)
    session_id: UUID | None = None

    def to_dict(self) -> dict[str, Any]:
        data = self.model_dump(mode="json")
        return data


class Opportunity(BaseModel):
    buy_exchange: str
    sell_exchange: str
    ask_price: float
    bid_price: float
    gross_profit_usd: float
    net_profit_usd: float | None = None
    volume_btc: float
    decision: Decision = Decision.NO_ACTION
    details: dict[str, Any] = Field(default_factory=dict)


class OrderBookSnapshot(BaseModel):
    exchange: str
    symbol: str
    best_bid: float
    best_ask: float
    bid_volume: float
    ask_volume: float
    latency_ms: int
    bids: list[list[float]] = Field(default_factory=list)
    asks: list[list[float]] = Field(default_factory=list)
    error: str | None = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
