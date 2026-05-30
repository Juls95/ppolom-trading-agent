#!/usr/bin/env python3
"""Verifica conexión y balances de OKX Demo + Bybit Demo."""
from __future__ import annotations

import asyncio
import sys

from app.config import get_settings
from app.core.demo_accounts import DemoAccountStore
from app.core.exchange_factory import create_public_exchange


async def main() -> int:
    get_settings.cache_clear()
    settings = get_settings()
    store = DemoAccountStore(settings)
    errors: list[str] = []

    print("=== Ppolom demo key check ===")
    print(f"Exchanges: {settings.exchanges}")
    print(f"DEMO_TRADE_ENABLED: {settings.demo_trade_enabled}")
    print()

    for ex in settings.exchanges:
        try:
            pub = await create_public_exchange(ex, settings)
            book = await pub.fetch_order_book(settings.symbol, limit=1)
            bid = book["bids"][0][0] if book.get("bids") else 0
            ask = book["asks"][0][0] if book.get("asks") else 0
            print(f"[{ex}] order book OK — bid={bid} ask={ask}")
            await pub.close()
        except Exception as exc:
            msg = f"[{ex}] order book FAIL: {exc}"
            print(msg)
            errors.append(msg)

    print()
    for ex in ("okx", "bybit"):
        cred = store.resolve_credential(ex)
        if not cred:
            msg = f"[{ex}] no hay credenciales en env (OKX_DEMO_* / BYBIT_DEMO_*)"
            print(msg)
            errors.append(msg)
            continue
        try:
            balances = await store.fetch_balances_for_cred(cred)
            print(f"[{ex}] balance OK — {balances or '(vacío)'}")
        except Exception as exc:
            if ex == "bybit" and not settings.bybit_demo_use_testnet:
                print(f"[{ex}] demo integrado falló ({exc}); probando testnet…")
                settings.bybit_demo_use_testnet = True
                store = DemoAccountStore(settings)
                cred = store.resolve_credential(ex)
                try:
                    balances = await store.fetch_balances_for_cred(cred)
                    print(f"[{ex}] balance OK (testnet) — {balances or '(vacío)'}")
                    print("  → Añade BYBIT_DEMO_USE_TESTNET=true a tu .env")
                    continue
                except Exception as exc2:
                    exc = exc2
            msg = f"[{ex}] balance FAIL: {exc}"
            print(msg)
            errors.append(msg)

    await store.close_all()
    print()
    if errors:
        print(f"RESULTADO: {len(errors)} error(es). Revisa permisos API e IP whitelist.")
        return 1
    print("RESULTADO: OK — listo para engine + dashboard.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
