from __future__ import annotations

import copy
from dataclasses import dataclass, field


@dataclass
class Wallet:
    balances: dict[str, dict[str, float]] = field(default_factory=dict)

    @classmethod
    def initial(cls, exchanges: list[str], usdt: float, btc: float) -> "Wallet":
        w = cls()
        for ex in exchanges:
            w.balances[ex] = {"USDT": usdt, "BTC": btc}
        return w

    def can_buy(self, exchange: str, usdt_needed: float) -> bool:
        return self.balances.get(exchange, {}).get("USDT", 0) >= usdt_needed

    def can_sell(self, exchange: str, btc_needed: float) -> bool:
        return self.balances.get(exchange, {}).get("BTC", 0) >= btc_needed

    def apply_trade(
        self,
        buy_exchange: str,
        sell_exchange: str,
        qty: float,
        ask: float,
        bid: float,
        fee_buy: float,
        fee_sell: float,
    ) -> float:
        buy_cost = ask * qty * (1 + fee_buy)
        sell_income = bid * qty * (1 - fee_sell)
        if not self.can_buy(buy_exchange, buy_cost):
            raise ValueError(f"Insufficient USDT on {buy_exchange}")
        if not self.can_sell(sell_exchange, qty):
            raise ValueError(f"Insufficient BTC on {sell_exchange}")

        self.balances[buy_exchange]["USDT"] -= buy_cost
        self.balances[buy_exchange]["BTC"] += qty
        self.balances[sell_exchange]["BTC"] -= qty
        self.balances[sell_exchange]["USDT"] += sell_income
        return sell_income - buy_cost

    def snapshot(self) -> dict[str, dict[str, float]]:
        return copy.deepcopy(self.balances)
