from __future__ import annotations

import secrets
import time
from dataclasses import dataclass, field
from typing import Any

import ccxt.async_support as ccxt

from app.config import Settings
from app.core.exchange_factory import SUPPORTED_DEMO_EXCHANGES, create_authenticated_exchange


@dataclass
class DemoCredential:
    exchange_id: str
    api_key: str
    secret: str
    password: str | None
    label: str
    owner_session_id: str
    connected_at: float = field(default_factory=time.time)
    last_balances: dict[str, float] = field(default_factory=dict)
    last_error: str | None = None


class DemoAccountStore:
    """In-memory demo credentials keyed by browser session id. Never persisted to Supabase."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._sessions: dict[str, dict[str, DemoCredential]] = {}
        self._clients: dict[str, ccxt.Exchange] = {}
        self._load_env_accounts()

    def _client_key(self, session_id: str, exchange_id: str) -> str:
        return f"{session_id}:{exchange_id}"

    def _load_env_accounts(self) -> None:
        """Operator credentials from env → system session."""
        sid = "system"
        self._sessions.setdefault(sid, {})
        pairs = [
            ("okx", self.settings.okx_demo_api_key, self.settings.okx_demo_api_secret, self.settings.okx_demo_password),
            ("bybit", self.settings.bybit_demo_api_key, self.settings.bybit_demo_api_secret, None),
        ]
        for ex, key, secret, pw in pairs:
            if key and secret:
                self._sessions[sid][ex] = DemoCredential(
                    exchange_id=ex,
                    api_key=key,
                    secret=secret,
                    password=pw or None,
                    label="env",
                    owner_session_id=sid,
                )

    def create_session(self) -> str:
        return secrets.token_urlsafe(24)

    def connect(
        self,
        session_id: str,
        exchange_id: str,
        api_key: str,
        secret: str,
        password: str | None,
        label: str = "user",
    ) -> None:
        if exchange_id not in SUPPORTED_DEMO_EXCHANGES:
            raise ValueError(f"Exchange no soportado: {exchange_id}")
        self._sessions.setdefault(session_id, {})
        self._sessions[session_id][exchange_id] = DemoCredential(
            exchange_id=exchange_id,
            api_key=api_key,
            secret=secret,
            password=password,
            label=label,
            owner_session_id=session_id,
        )
        ck = self._client_key(session_id, exchange_id)
        if ck in self._clients:
            del self._clients[ck]

    def disconnect(self, session_id: str, exchange_id: str) -> None:
        sess = self._sessions.get(session_id, {})
        sess.pop(exchange_id, None)
        ck = self._client_key(session_id, exchange_id)
        self._clients.pop(ck, None)

    def list_accounts(self, session_id: str) -> list[dict[str, Any]]:
        sess = self._sessions.get(session_id, {})
        return [
            {
                "exchange": cred.exchange_id,
                "label": cred.label,
                "connected_at": cred.connected_at,
                "last_balances": cred.last_balances,
                "last_error": cred.last_error,
                "meta": SUPPORTED_DEMO_EXCHANGES.get(cred.exchange_id, {}),
            }
            for cred in sess.values()
        ]

    def get_credential(self, session_id: str, exchange_id: str) -> DemoCredential | None:
        return self._sessions.get(session_id, {}).get(exchange_id)

    def resolve_credential(self, exchange_id: str, session_id: str | None = None) -> DemoCredential | None:
        if session_id:
            cred = self.get_credential(session_id, exchange_id)
            if cred:
                return cred
        return self.get_credential("system", exchange_id)

    async def get_client(self, cred: DemoCredential) -> ccxt.Exchange:
        ck = self._client_key(cred.owner_session_id, cred.exchange_id)
        if ck in self._clients:
            return self._clients[ck]
        ex = await create_authenticated_exchange(
            cred.exchange_id, cred.api_key, cred.secret, cred.password, self.settings
        )
        self._clients[ck] = ex
        return ex

    async def fetch_balances_for_cred(self, cred: DemoCredential) -> dict[str, float]:
        try:
            ex = await self.get_client(cred)
            raw = await ex.fetch_balance()
            totals = raw.get("total") or {}
            balances = {k: float(v) for k, v in totals.items() if v and float(v) > 0}
            cred.last_balances = balances
            cred.last_error = None
            return balances
        except Exception as exc:
            cred.last_error = str(exc)
            raise

    async def fetch_balances(self, session_id: str, exchange_id: str) -> dict[str, float]:
        cred = self.get_credential(session_id, exchange_id)
        if not cred:
            raise ValueError(f"Cuenta no conectada: {exchange_id}")
        return await self.fetch_balances_for_cred(cred)

    async def validate_and_connect(
        self,
        session_id: str,
        exchange_id: str,
        api_key: str,
        secret: str,
        password: str | None,
        label: str = "user",
    ) -> dict[str, float]:
        self.connect(session_id, exchange_id, api_key, secret, password, label)
        return await self.fetch_balances(session_id, exchange_id)

    async def close_all(self) -> None:
        for ex in self._clients.values():
            await ex.close()
        self._clients.clear()
