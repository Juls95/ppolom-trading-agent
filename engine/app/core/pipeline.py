from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.agents.chaac import evaluate_costs
from app.agents.itzamna import detect_opportunities
from app.agents.ixchel import evaluate_liquidity
from app.agents.kukulkan import simulate_execution
from app.config import Settings
from app.core.risk import CircuitBreaker
from app.core.wallet import Wallet
from app.db.supabase_repo import SupabaseRepo
from app.events import Decision, Opportunity, OrderBookSnapshot, TraceEvent
from app.state import EngineState


AGENT_NAMES = {
    "hunab_ku": "Hunab Ku",
    "itzamna": "Itzamná",
    "chaac": "Chaac",
    "ixchel": "Ixchel",
    "kukulkan": "Kukulkán",
    "kinich_ahau": "Kinich Ahau",
}


class Pipeline:
    def __init__(
        self,
        settings: Settings,
        engine_state: EngineState,
        wallet: Wallet,
        repo: SupabaseRepo,
        breaker: CircuitBreaker,
    ) -> None:
        self.settings = settings
        self.state = engine_state
        self.wallet = wallet
        self.repo = repo
        self.breaker = breaker

    def _emit(self, agent_id: str, event_type: str, message: str, vote: bool | None = None, payload: dict | None = None) -> TraceEvent:
        ev = TraceEvent(
            agent_id=agent_id,
            agent_name=AGENT_NAMES[agent_id],
            event_type=event_type,
            vote=vote,
            message=message,
            payload=payload or {},
            session_id=self.state.session_id,
        )
        self.state.publish(ev)
        self.repo.insert_trace(ev.model_dump(mode="json"))
        return ev

    async def run(self, books: dict[str, OrderBookSnapshot]) -> Opportunity | None:
        self.state.last_pipeline_at = datetime.utcnow().isoformat()

        if self.breaker.is_paused():
            self._emit("kinich_ahau", "circuit_breaker", f"Sistema pausado: {self.breaker.reason}", vote=False)
            return None

        # Hunab Ku
        ok_books = [b for b in books.values() if not b.error]
        err_books = [b for b in books.values() if b.error]
        for b in books.values():
            self.repo.insert_market_snapshot(
                {
                    "exchange": b.exchange,
                    "symbol": b.symbol,
                    "best_bid": b.best_bid,
                    "best_ask": b.best_ask,
                    "bid_volume": b.bid_volume,
                    "ask_volume": b.ask_volume,
                    "latency_ms": b.latency_ms,
                }
            )
        if err_books:
            for b in err_books:
                self.state.exchange_errors[b.exchange] = b.error or "unknown"
                self._emit(
                    "hunab_ku",
                    "exchange_error",
                    f"{b.exchange}: {b.error}",
                    vote=False,
                    payload={"exchange": b.exchange, "error": b.error},
                )
        if len(ok_books) < 2:
            self._emit("hunab_ku", "monitor", "Datos insuficientes — se requieren ≥2 exchanges operativos", vote=False)
            return None

        latencies = ", ".join(f"{b.exchange} {b.latency_ms}ms" for b in ok_books)
        self._emit("hunab_ku", "monitor", f"Order books actualizados ({latencies})", vote=True, payload={"books": len(ok_books)})

        # Itzamná
        opps = detect_opportunities(books)
        if not opps:
            self._emit("itzamna", "detect", "Sin divergencia ask<bid entre exchanges — NO_ACTION", vote=False)
            return None

        opp = opps[0]
        self.state.opportunities_count += 1
        self._emit(
            "itzamna",
            "detect",
            f"Oportunidad: comprar {opp.buy_exchange} @ {opp.ask_price:.2f}, vender {opp.sell_exchange} @ {opp.bid_price:.2f} · bruto ${opp.gross_profit_usd:.2f}",
            vote=True,
            payload=opp.model_dump(),
        )

        # Chaac
        cost_vote, cost_details = evaluate_costs(opp, self.settings, books)
        if not cost_vote:
            opp.decision = Decision.REJECT
            self._emit(
                "chaac",
                "costs",
                f"Rechazado: neto ${cost_details['net']:.2f} < umbral ${self.settings.min_net_profit_usd}",
                vote=False,
                payload=cost_details,
            )
            self.repo.insert_opportunity({**opp.model_dump(mode="json"), "session_id": str(self.state.session_id), "decision": opp.decision.value})
            return opp

        self._emit(
            "chaac",
            "costs",
            f"Aprobado: ganancia neta estimada ${cost_details['net']:.2f}",
            vote=True,
            payload=cost_details,
        )

        # Ixchel
        liq_vote, qty, liq_decision = evaluate_liquidity(opp, self.wallet, self.settings)
        if not liq_vote or qty <= 0:
            opp.decision = Decision.NO_ACTION
            self._emit("ixchel", "liquidity", "Sin liquidez/balance suficiente", vote=False)
            self.repo.insert_opportunity({**opp.model_dump(mode="json"), "session_id": str(self.state.session_id), "decision": opp.decision.value})
            return opp

        self._emit(
            "ixchel",
            "liquidity",
            f"{'Ejecución parcial' if liq_decision == Decision.PARTIAL else 'Liquidez OK'}: {qty:.4f} BTC",
            vote=True,
            payload={"qty": qty, "partial": liq_decision == Decision.PARTIAL},
        )

        # Kukulkán — all prior votes True
        exec_ok, net, latency = simulate_execution(opp, self.wallet, qty, self.settings)
        if not exec_ok:
            opp.decision = Decision.REJECT
            self._emit("kukulkan", "execute", "Ejecución simulada falló", vote=False)
            return opp

        self._emit(
            "kukulkan",
            "execute",
            f"Trade simulado: +${net:.2f} en {latency}ms",
            vote=True,
            payload={"net": net, "latency_ms": latency},
        )

        # Kinich Ahau
        self.state.total_pnl += net
        self.state.trades_count += 1
        self.state.peak_pnl = max(self.state.peak_pnl, self.state.total_pnl)
        if self.state.peak_pnl > 0:
            dd = (self.state.peak_pnl - self.state.total_pnl) / self.state.peak_pnl
            self.state.max_drawdown = max(self.state.max_drawdown, dd)
        self.breaker.update(self.state.total_pnl)

        opp_id = self.repo.insert_opportunity(
            {**opp.model_dump(mode="json"), "session_id": str(self.state.session_id), "decision": opp.decision.value}
        )
        self.repo.insert_trade(
            {
                "opportunity_id": opp_id,
                "buy_exchange": opp.buy_exchange,
                "sell_exchange": opp.sell_exchange,
                "qty_btc": qty,
                "buy_price": opp.ask_price,
                "sell_price": opp.bid_price,
                "net_profit_usd": net,
                "latency_ms": latency,
                "status": "simulated",
            }
        )
        self.repo.insert_wallet_snapshot(self.wallet.snapshot())

        self._emit(
            "kinich_ahau",
            "record",
            f"P&L acumulado: ${self.state.total_pnl:.2f} · trades: {self.state.trades_count}",
            vote=True,
            payload={"total_pnl": self.state.total_pnl, "trades": self.state.trades_count},
        )
        return opp
