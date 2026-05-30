from __future__ import annotations

from itertools import combinations
from typing import Any

from app.events import Opportunity, OrderBookSnapshot


def detect_opportunities(
    books: dict[str, OrderBookSnapshot],
    min_gross_usd: float = 0,
) -> list[Opportunity]:
    """Compare all exchange pairs; find ask < bid divergences."""
    valid = {k: v for k, v in books.items() if not v.error and v.best_ask > 0 and v.best_bid > 0}
    opps: list[Opportunity] = []
    for buy_ex, sell_ex in combinations(valid.keys(), 2):
        for b, s in [(buy_ex, sell_ex), (sell_ex, buy_ex)]:
            buy_book, sell_book = valid[b], valid[s]
            ask = buy_book.best_ask
            bid = sell_book.best_bid
            if ask >= bid:
                continue
            vol = min(buy_book.ask_volume, sell_book.bid_volume, 1.0)
            if vol <= 0:
                vol = 0.01
            gross = (bid - ask) * vol
            if gross < min_gross_usd:
                continue
            score = gross * vol
            opps.append(
                Opportunity(
                    buy_exchange=b,
                    sell_exchange=s,
                    ask_price=ask,
                    bid_price=bid,
                    gross_profit_usd=gross,
                    volume_btc=vol,
                    details={"priority_score": score},
                )
            )
    opps.sort(key=lambda o: o.details.get("priority_score", 0), reverse=True)
    return opps
