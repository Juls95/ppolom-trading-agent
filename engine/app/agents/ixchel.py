from __future__ import annotations

from app.config import Settings
from app.core.wallet import Wallet
from app.events import Decision, Opportunity


def evaluate_liquidity(
    opp: Opportunity,
    wallet: Wallet,
    settings: Settings,
) -> tuple[bool, float, Decision]:
    fee_buy = settings.fee_for(opp.buy_exchange)
    fee_sell = settings.fee_for(opp.sell_exchange)
    requested = opp.volume_btc
    buy_cost = opp.ask_price * requested * (1 + fee_buy)

    if not wallet.can_buy(opp.buy_exchange, buy_cost):
        max_usdt = wallet.balances.get(opp.buy_exchange, {}).get("USDT", 0)
        max_qty = max_usdt / (opp.ask_price * (1 + fee_buy)) if opp.ask_price else 0
        requested = min(requested, max_qty)

    if not wallet.can_sell(opp.sell_exchange, requested):
        max_btc = wallet.balances.get(opp.sell_exchange, {}).get("BTC", 0)
        requested = min(requested, max_btc)

    if requested <= 0:
        return False, 0, Decision.NO_ACTION

    partial = requested < opp.volume_btc
    decision = Decision.PARTIAL if partial else Decision.EXECUTE
    return True, requested, decision
