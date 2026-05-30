from __future__ import annotations

import time

from app.config import Settings
from app.core.wallet import Wallet
from app.core.costs import net_profit
from app.events import Decision, Opportunity


def simulate_execution(
    opp: Opportunity,
    wallet: Wallet,
    qty: float,
    settings: Settings,
    skip_wallet: bool = False,
) -> tuple[bool, float, int]:
    fee_buy = settings.fee_for(opp.buy_exchange)
    fee_sell = settings.fee_for(opp.sell_exchange)
    try:
        if skip_wallet:
            result = net_profit(
                ask=opp.ask_price,
                bid=opp.bid_price,
                qty=qty,
                fee_buy=fee_buy,
                fee_sell=fee_sell,
                slippage_rate=settings.slippage_rate,
                withdrawal_usd=settings.withdrawal_fee_usd,
            )
            net = result["net"]
        else:
            net = wallet.apply_trade(
                buy_exchange=opp.buy_exchange,
                sell_exchange=opp.sell_exchange,
                qty=qty,
                ask=opp.ask_price,
                bid=opp.bid_price,
                fee_buy=fee_buy,
                fee_sell=fee_sell,
            )
        latency = int((time.perf_counter() % 1) * 250 + 50)
        opp.decision = Decision.EXECUTE if qty >= opp.volume_btc else Decision.PARTIAL
        opp.volume_btc = qty
        opp.net_profit_usd = net
        return True, net, latency
    except ValueError:
        return False, 0.0, 0
