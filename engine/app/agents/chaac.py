from __future__ import annotations

from app.config import Settings
from app.core.costs import net_profit
from app.events import Opportunity


def evaluate_costs(opp: Opportunity, settings: Settings, books: dict) -> tuple[bool, dict]:
    fee_buy = settings.fee_for(opp.buy_exchange)
    fee_sell = settings.fee_for(opp.sell_exchange)
    result = net_profit(
        ask=opp.ask_price,
        bid=opp.bid_price,
        qty=opp.volume_btc,
        fee_buy=fee_buy,
        fee_sell=fee_sell,
        slippage_rate=settings.slippage_rate,
        withdrawal_usd=settings.withdrawal_fee_usd,
    )
    vote = result["net"] >= settings.min_net_profit_usd
    details = {
        **result,
        "fee_buy": fee_buy,
        "fee_sell": fee_sell,
        "min_threshold": settings.min_net_profit_usd,
    }
    opp.net_profit_usd = result["net"]
    opp.details.update(details)
    return vote, details
