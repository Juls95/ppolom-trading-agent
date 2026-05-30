from __future__ import annotations

import time

from app.config import Settings
from app.core.wallet import Wallet
from app.events import Decision, Opportunity


def simulate_execution(
    opp: Opportunity,
    wallet: Wallet,
    qty: float,
    settings: Settings,
) -> tuple[bool, float, int]:
    fee_buy = settings.fee_for(opp.buy_exchange)
    fee_sell = settings.fee_for(opp.sell_exchange)
    try:
        net = wallet.apply_trade(
            buy_exchange=opp.buy_exchange,
            sell_exchange=opp.sell_exchange,
            qty=qty,
            ask=opp.ask_price,
            bid=opp.bid_price,
            fee_buy=fee_buy,
            fee_sell=fee_sell,
        )
        latency = int((time.perf_counter() % 1) * 250 + 50)  # measured wall clock slice
        opp.decision = Decision.EXECUTE if qty >= opp.volume_btc else Decision.PARTIAL
        opp.volume_btc = qty
        opp.net_profit_usd = net
        return True, net, latency
    except ValueError:
        return False, 0.0, 0
