"""Seed clearly-labeled DEMO sessions into Supabase (separate from live tables)."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.db.supabase_repo import SupabaseRepo

DEMO_SESSIONS = [
    {
        "slug": "rechazo-fees",
        "title": "DEMO · Rechazo por fees",
        "description": "Datos simulados para demostrar rechazo cuando el bruto es positivo pero el neto es negativo tras fees.",
        "scenario_type": "REJECT",
        "data_source": "seed",
        "is_demo": True,
        "badge_label": "DEMO · Datos simulados",
        "outcome": "REJECT",
        "metadata": {"note": "No mezclar con live_opportunities"},
    },
    {
        "slug": "sin-accion",
        "title": "DEMO · Sin divergencia",
        "description": "Datos simulados: mercado alineado, Itzamná reporta NO_ACTION.",
        "scenario_type": "NO_ACTION",
        "data_source": "seed",
        "is_demo": True,
        "badge_label": "DEMO · Datos simulados",
        "outcome": "NO_ACTION",
        "metadata": {},
    },
    {
        "slug": "ejecucion-exitosa",
        "title": "DEMO · Ejecución simulada exitosa",
        "description": "Datos simulados ilustrando el flujo completo con los 6 agentes en verde (Kraken↔Binance).",
        "scenario_type": "EXECUTE",
        "data_source": "seed",
        "is_demo": True,
        "badge_label": "DEMO · Datos simulados",
        "outcome": "EXECUTE",
        "metadata": {"exchanges": ["kraken", "binance"]},
    },
    {
        "slug": "orden-parcial",
        "title": "DEMO · Orden parcial",
        "description": "Datos simulados: Ixchel reduce volumen por liquidez limitada.",
        "scenario_type": "PARTIAL",
        "data_source": "seed",
        "is_demo": True,
        "badge_label": "DEMO · Datos simulados",
        "outcome": "PARTIAL",
        "metadata": {},
    },
    {
        "slug": "error-exchange",
        "title": "DEMO · Error de exchange",
        "description": "Datos simulados: Hunab Ku reporta fallo de conexión con diagnóstico explícito.",
        "scenario_type": "ERROR",
        "data_source": "seed",
        "is_demo": True,
        "badge_label": "DEMO · Datos simulados",
        "outcome": "NO_ACTION",
        "metadata": {"error_class": "ExchangeNotAvailable"},
    },
]


def events_for(slug: str) -> list[dict]:
    base = [
        ("hunab_ku", "Hunab Ku", "monitor", True, "Order books actualizados"),
        ("itzamna", "Itzamná", "detect", None, "Evaluando divergencias"),
    ]
    if slug == "rechazo-fees":
        return _build(base + [
            ("itzamna", "Itzamná", "detect", True, "Divergencia detectada: bruto +$45"),
            ("chaac", "Chaac", "costs", False, "Rechazado: neto -$12 tras fees 0.18% + slippage + retiro"),
            ("kinich_ahau", "Kinich Ahau", "record", False, "Oportunidad registrada como REJECT"),
        ])
    if slug == "sin-accion":
        return _build(base + [
            ("itzamna", "Itzamná", "detect", False, "Sin divergencia ask<bid — NO_ACTION"),
        ])
    if slug == "ejecucion-exitosa":
        return _build(base + [
            ("itzamna", "Itzamná", "detect", True, "Kraken ask $69,980 < Binance bid $70,250 · bruto $270"),
            ("chaac", "Chaac", "costs", True, "Neto +$109.75 tras fees (ejemplo MainRequest)"),
            ("ixchel", "Ixchel", "liquidity", True, "Liquidez OK: 1.0 BTC"),
            ("kukulkan", "Kukulkán", "execute", True, "Trade simulado ejecutado"),
            ("kinich_ahau", "Kinich Ahau", "record", True, "P&L +$109.75 registrado en Supabase live_trades"),
        ])
    if slug == "orden-parcial":
        return _build(base + [
            ("itzamna", "Itzamná", "detect", True, "Divergencia detectada"),
            ("chaac", "Chaac", "costs", True, "Neto positivo"),
            ("ixchel", "Ixchel", "liquidity", True, "Parcial: 0.15 BTC de 1.0 solicitado"),
            ("kukulkan", "Kukulkán", "execute", True, "Ejecución parcial simulada"),
            ("kinich_ahau", "Kinich Ahau", "record", True, "Trade parcial registrado"),
        ])
    if slug == "error-exchange":
        return _build([
            ("hunab_ku", "Hunab Ku", "exchange_error", False, "binance: ExchangeNotAvailable — geo-block o timeout"),
            ("hunab_ku", "Hunab Ku", "monitor", False, "Solo 1/3 exchanges operativos — pipeline detenido"),
        ])
    return []


def _build(rows: list[tuple]) -> list[dict]:
    return [
        {
            "seq": i,
            "agent_id": r[0],
            "agent_name": r[1],
            "event_type": r[2],
            "vote": r[3],
            "message": r[4],
            "payload": {},
        }
        for i, r in enumerate(rows)
    ]


def main() -> None:
    settings = get_settings()
    repo = SupabaseRepo(settings)
    if not repo.enabled:
        print("Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    for session in DEMO_SESSIONS:
        repo.seed_demo_session(session, events_for(session["slug"]))
        print(f"Seeded demo session: {session['slug']}")


if __name__ == "__main__":
    main()
