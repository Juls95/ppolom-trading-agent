from __future__ import annotations

from typing import Any

import ccxt.async_support as ccxt

from app.config import Settings

SUPPORTED_DEMO_EXCHANGES: dict[str, dict[str, str]] = {
    "okx": {
        "label": "OKX Demo Trading",
        "docs": "https://www.okx.com/help/demo-trading",
        "needs_passphrase": "true",
    },
    "bybit": {
        "label": "Bybit Demo / Testnet",
        "docs": "https://www.bybit.com/en/help-center/article/Introduction-to-Demo-Trading",
        "needs_passphrase": "false",
    },
}


def _base_options() -> dict[str, Any]:
    return {"enableRateLimit": True}


def apply_demo_mode(exchange: ccxt.Exchange, exchange_id: str, settings: Settings) -> None:
    """Authenticated demo endpoints only (not public order-book polling)."""
    if exchange_id == "okx" and hasattr(exchange, "set_sandbox_mode"):
        exchange.set_sandbox_mode(True)
    elif exchange_id == "bybit":
        exchange.options = {**exchange.options, "defaultType": "spot"}
        if settings.bybit_demo_use_testnet and hasattr(exchange, "set_sandbox_mode"):
            exchange.set_sandbox_mode(True)
        elif hasattr(exchange, "enable_demo_trading"):
            exchange.enable_demo_trading(True)
        elif hasattr(exchange, "set_sandbox_mode"):
            exchange.set_sandbox_mode(True)


async def create_public_exchange(exchange_id: str, settings: Settings) -> ccxt.Exchange:
    klass = getattr(ccxt, exchange_id)
    opts = _base_options()
    if exchange_id == "bybit":
        opts["options"] = {"defaultType": "spot"}
    ex = klass(opts)
    if settings.use_sandbox and hasattr(ex, "set_sandbox_mode"):
        ex.set_sandbox_mode(True)
    return ex


async def create_authenticated_exchange(
    exchange_id: str,
    api_key: str,
    secret: str,
    password: str | None,
    settings: Settings,
) -> ccxt.Exchange:
    klass = getattr(ccxt, exchange_id)
    config: dict[str, Any] = {
        **_base_options(),
        "apiKey": api_key,
        "secret": secret,
    }
    if password:
        config["password"] = password
    if exchange_id == "bybit":
        config["options"] = {"defaultType": "spot"}
    ex = klass(config)
    apply_demo_mode(ex, exchange_id, settings)
    await ex.load_markets()
    return ex
