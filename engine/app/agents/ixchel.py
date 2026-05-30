from __future__ import annotations

from typing import TYPE_CHECKING

from app.config import Settings
from app.core.wallet import Wallet
from app.events import Decision, Opportunity

if TYPE_CHECKING:
    pass


def evaluate_liquidity(
    opp: Opportunity,
    wallet: Wallet,
    settings: Settings,
    demo_balances: dict[str, dict[str, float]] | None = None,
) -> tuple[bool, float, Decision, str]:
    """Return (vote, qty, decision, detail_message)."""
    fee_buy = settings.fee_for(opp.buy_exchange)
    fee_sell = settings.fee_for(opp.sell_exchange)
    requested = opp.volume_btc

    if settings.demo_trade_enabled and demo_balances:
        buy_usdt = float(demo_balances.get(opp.buy_exchange, {}).get("USDT", 0))
        sell_btc = float(demo_balances.get(opp.sell_exchange, {}).get("BTC", 0))
        min_qty = settings.demo_min_qty_btc
        max_from_usdt = buy_usdt / (opp.ask_price * (1 + fee_buy)) if opp.ask_price else 0

        if max_from_usdt < min_qty or sell_btc < min_qty:
            missing = []
            if max_from_usdt < min_qty:
                missing.append(f"USDT en {opp.buy_exchange} ({buy_usdt:.2f}, necesita ~{opp.ask_price * min_qty:.0f})")
            if sell_btc < min_qty:
                missing.append(f"BTC en {opp.sell_exchange} ({sell_btc:.4f}, mín {min_qty})")
            detail = "Demo CEX: " + ", ".join(missing)
            return False, 0, Decision.NO_ACTION, detail

        qty = min(min_qty, max_from_usdt, sell_btc, requested)
        partial = qty < requested
        return True, qty, Decision.PARTIAL if partial else Decision.EXECUTE, f"Demo: {qty:.4f} BTC"

    buy_cost = opp.ask_price * requested * (1 + fee_buy)

    if not wallet.can_buy(opp.buy_exchange, buy_cost):
        max_usdt = wallet.balances.get(opp.buy_exchange, {}).get("USDT", 0)
        max_qty = max_usdt / (opp.ask_price * (1 + fee_buy)) if opp.ask_price else 0
        requested = min(requested, max_qty)

    if not wallet.can_sell(opp.sell_exchange, requested):
        max_btc = wallet.balances.get(opp.sell_exchange, {}).get("BTC", 0)
        requested = min(requested, max_btc)

    if requested <= 0:
        return False, 0, Decision.NO_ACTION, "Wallet simulada sin liquidez"

    partial = requested < opp.volume_btc
    decision = Decision.PARTIAL if partial else Decision.EXECUTE
    return True, requested, decision, f"Simulado: {requested:.4f} BTC"
