from __future__ import annotations


def net_profit(
    ask: float,
    bid: float,
    qty: float,
    fee_buy: float,
    fee_sell: float,
    slippage_rate: float,
    withdrawal_usd: float,
) -> dict[str, float]:
    """Net arbitrage profit after fees, slippage, withdrawal."""
    cost = ask * qty * (1 + fee_buy) + withdrawal_usd
    slippage = bid * qty * slippage_rate
    income = bid * qty * (1 - fee_sell) - slippage
    net = income - cost
    gross = (bid - ask) * qty
    return {
        "gross": gross,
        "cost": cost,
        "income": income,
        "net": net,
        "slippage": slippage,
    }


def walk_slippage(asks_or_bids: list[list[float]], qty: float, side: str) -> float:
    """Estimate average fill price walking the book."""
    remaining = qty
    total = 0.0
    filled = 0.0
    levels = asks_or_bids if side == "buy" else asks_or_bids
    for level in levels:
        price, vol = float(level[0]), float(level[1])
        take = min(remaining, vol)
        total += price * take
        filled += take
        remaining -= take
        if remaining <= 0:
            break
    if filled <= 0:
        return 0.0
    return total / filled
