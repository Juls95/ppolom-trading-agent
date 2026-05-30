from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str = ""
    supabase_service_role_key: str = ""

    exchange_a: str = "binance"
    exchange_b: str = "okx"
    exchange_c: str = "kraken"
    symbol: str = "BTC/USDT"
    use_sandbox: bool = False

    min_net_profit_usd: float = 25.0
    taker_fee_binance: float = 0.001
    taker_fee_okx: float = 0.0008
    taker_fee_kraken: float = 0.0026
    slippage_rate: float = 0.0005
    withdrawal_fee_usd: float = 10.0
    max_drawdown_pct: float = 0.5
    poll_interval_ms: int = 500
    start_balance_usdt: float = 100_000.0
    start_balance_btc: float = 2.0

    engine_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    llm_narration_enabled: bool = False
    llm_provider: Literal["gemini", "openai", "anthropic", "none"] = "none"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"

    def fee_for(self, exchange_id: str) -> float:
        mapping = {
            self.exchange_a: self.taker_fee_binance,
            self.exchange_b: self.taker_fee_okx,
            self.exchange_c: self.taker_fee_kraken,
            "binance": self.taker_fee_binance,
            "okx": self.taker_fee_okx,
            "kraken": self.taker_fee_kraken,
        }
        return mapping.get(exchange_id.lower(), 0.001)

    @property
    def exchanges(self) -> list[str]:
        return [self.exchange_a, self.exchange_b, self.exchange_c]

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
