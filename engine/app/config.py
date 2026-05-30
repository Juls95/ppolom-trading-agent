from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    supabase_url: str = ""
    supabase_service_role_key: str = ""

    exchange_a: str = "okx"
    exchange_b: str = "bybit"
    exchange_c: str = "bybit"
    symbol: str = "BTC/USDT"
    use_sandbox: bool = False

    min_net_profit_usd: float = 1.0
    taker_fee_okx: float = 0.0008
    taker_fee_bybit: float = 0.001
    taker_fee_kraken: float = 0.0026
    taker_fee_binance: float = 0.001
    slippage_rate: float = 0.0005
    withdrawal_fee_usd: float = 0.0
    max_drawdown_pct: float = 0.5
    poll_interval_ms: int = 500
    start_balance_usdt: float = 100_000.0
    start_balance_btc: float = 2.0

    demo_trade_enabled: bool = False
    demo_min_qty_btc: float = 0.001

    okx_demo_api_key: str = ""
    okx_demo_api_secret: str = ""
    okx_demo_password: str = ""

    bybit_demo_api_key: str = ""
    bybit_demo_api_secret: str = ""
    # False = Bybit integrated demo (enable_demo_trading); True = testnet.bybit.com keys
    bybit_demo_use_testnet: bool = False
    # Public order-book polling: defaults True when bybit_demo_use_testnet (avoids US geo-block on Fly)
    bybit_public_use_testnet: bool | None = None

    engine_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    llm_narration_enabled: bool = False
    llm_provider: Literal["gemini", "openai", "anthropic", "none"] = "none"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"

    def fee_for(self, exchange_id: str) -> float:
        mapping = {
            "okx": self.taker_fee_okx,
            "bybit": self.taker_fee_bybit,
            "kraken": self.taker_fee_kraken,
            "binance": self.taker_fee_binance,
        }
        return mapping.get(exchange_id.lower(), 0.001)

    @property
    def exchanges(self) -> list[str]:
        seen: list[str] = []
        for ex in [self.exchange_a, self.exchange_b, self.exchange_c]:
            if ex not in seen:
                seen.append(ex)
        return seen

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def bybit_public_sandbox(self) -> bool:
        if self.bybit_public_use_testnet is not None:
            return self.bybit_public_use_testnet
        # Mainnet order books by default (Fly ams). Set BYBIT_PUBLIC_USE_TESTNET=true on US IPs.
        return False


@lru_cache
def get_settings() -> Settings:
    return Settings()
