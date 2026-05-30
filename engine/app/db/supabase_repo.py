from __future__ import annotations

from typing import Any

import httpx

from app.config import Settings


class SupabaseRepo:
    """Thin PostgREST client — avoids supabase-py aiohttp conflict with ccxt."""

    def __init__(self, settings: Settings) -> None:
        self.enabled = bool(settings.supabase_url and settings.supabase_service_role_key)
        self.base = settings.supabase_url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _post(self, table: str, row: dict[str, Any] | list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not self.enabled:
            return []
        with httpx.Client(timeout=15) as client:
            r = client.post(f"{self.base}/{table}", headers=self.headers, json=row)
            r.raise_for_status()
            return r.json() if r.text else []

    def _get(self, table: str, params: dict[str, str]) -> list[dict[str, Any]]:
        if not self.enabled:
            return []
        with httpx.Client(timeout=15) as client:
            r = client.get(f"{self.base}/{table}", headers=self.headers, params=params)
            r.raise_for_status()
            return r.json() if r.text else []

    def insert_trace(self, row: dict[str, Any]) -> None:
        self._post("live_trace_events", row)

    def insert_opportunity(self, row: dict[str, Any]) -> str | None:
        data = self._post("live_opportunities", row)
        return data[0]["id"] if data else None

    def insert_trade(self, row: dict[str, Any]) -> None:
        self._post("live_trades", row)

    def insert_market_snapshot(self, row: dict[str, Any]) -> None:
        self._post("live_market_snapshots", row)

    def insert_wallet_snapshot(self, balances: dict[str, Any]) -> None:
        self._post("live_wallet_snapshots", {"balances": balances})

    def list_demo_sessions(self) -> list[dict[str, Any]]:
        return self._get("demo_sessions", {"select": "*", "order": "created_at.asc"})

    def get_demo_session(self, slug: str) -> dict[str, Any] | None:
        rows = self._get("demo_sessions", {"select": "*", "slug": f"eq.{slug}", "limit": "1"})
        return rows[0] if rows else None

    def get_demo_traces(self, session_id: str) -> list[dict[str, Any]]:
        return self._get(
            "demo_trace_events",
            {"select": "*", "session_id": f"eq.{session_id}", "order": "seq.asc"},
        )

    def seed_demo_session(self, session: dict[str, Any], events: list[dict[str, Any]]) -> None:
        if not self.enabled:
            return
        existing = self.get_demo_session(session["slug"])
        if existing:
            return
        created = self._post("demo_sessions", session)
        if not created:
            return
        sid = created[0]["id"]
        for ev in events:
            ev["session_id"] = sid
        self._post("demo_trace_events", events)

    def recent_trades(self, limit: int = 50) -> list[dict[str, Any]]:
        return self._get("live_trades", {"select": "*", "order": "created_at.desc", "limit": str(limit)})

    def recent_opportunities(self, limit: int = 50) -> list[dict[str, Any]]:
        return self._get(
            "live_opportunities",
            {"select": "*", "order": "created_at.desc", "limit": str(limit)},
        )

    def recent_trace_events(self, limit: int = 100) -> list[dict[str, Any]]:
        return self._get(
            "live_trace_events",
            {"select": "*", "order": "created_at.desc", "limit": str(limit)},
        )
