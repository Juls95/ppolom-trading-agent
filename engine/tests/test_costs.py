from app.core.costs import net_profit


def test_mainrequest_example():
    # MainRequest.md worked example: buy 70k, sell 70250, 1 BTC, 0.1% fees
    r = net_profit(
        ask=70_000,
        bid=70_250,
        qty=1.0,
        fee_buy=0.001,
        fee_sell=0.001,
        slippage_rate=0.0,
        withdrawal_usd=0,
    )
    assert abs(r["gross"] - 250) < 0.01
    # With zero slippage/withdrawal: net ≈ 250 - 70 - 70.25 = 109.75
    assert abs(r["net"] - 109.75) < 0.01


def test_reject_when_fees_high():
    r = net_profit(
        ask=70_000,
        bid=70_050,
        qty=1.0,
        fee_buy=0.001,
        fee_sell=0.001,
        slippage_rate=0.0005,
        withdrawal_usd=10,
    )
    assert r["net"] < 0
