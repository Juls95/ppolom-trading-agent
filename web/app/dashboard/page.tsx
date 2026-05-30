"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { OpportunityDeliberation } from "@/components/council/OpportunityDeliberation";
import { DemoAccountPanel } from "@/components/dashboard/DemoAccountPanel";
import { DemoBalanceCards } from "@/components/dashboard/DemoBalanceCards";
import { HowItWorksPanel } from "@/components/dashboard/HowItWorksPanel";
import { JudgeChecklist } from "@/components/dashboard/JudgeChecklist";
import { LiveVerificationBanner } from "@/components/dashboard/LiveVerificationBanner";
import { TradeProofPanel } from "@/components/dashboard/TradeProofPanel";
import {
  fetchDemoVerify,
  fetchEngineState,
  fetchTrades,
  fetchOpportunities,
} from "@/lib/api";
import type { DemoVerifyResponse, TradeRow } from "@/lib/dashboard";
import { splitTrades } from "@/lib/dashboard";
import { computeDecisionMetrics, type OpportunityRow } from "@/lib/deliberation";
import { fetchLiveTraceEvents } from "@/lib/supabase";
import { ENGINE_WS, type TraceEvent } from "@/lib/types";
import { TraceEventSchema } from "@/lib/types";

type EngineState = {
  running: boolean;
  books: Record<
    string,
    {
      exchange: string;
      best_bid: number;
      best_ask: number;
      latency_ms: number;
      error?: string;
    }
  >;
  exchange_errors: Record<string, string>;
  total_pnl: number;
  trades_count: number;
  opportunities_count: number;
  supabase_connected?: boolean;
  demo_trade_enabled?: boolean;
  demo_balances?: Record<string, { label: string; balances: Record<string, number>; error?: string }>;
};

function parseTrace(raw: unknown): TraceEvent {
  return TraceEventSchema.parse(raw);
}

export default function DashboardPage() {
  const [state, setState] = useState<EngineState | null>(null);
  const [verify, setVerify] = useState<DemoVerifyResponse | null>(null);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [opps, setOpps] = useState<OpportunityRow[]>([]);
  const [liveEvents, setLiveEvents] = useState<TraceEvent[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed">("connecting");

  const metrics = useMemo(() => computeDecisionMetrics(opps), [opps]);
  const { real: realTrades } = useMemo(() => splitTrades(trades), [trades]);

  const loadTraces = useCallback(async () => {
    try {
      const rows = await fetchLiveTraceEvents(150);
      setLiveEvents(rows.map((r: unknown) => parseTrace(r)));
    } catch {
      /* WS may still stream events */
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, o, v] = await Promise.all([
          fetchEngineState(),
          fetchTrades(),
          fetchOpportunities(),
          fetchDemoVerify(),
        ]);
        setState(s);
        setTrades((t as TradeRow[]) ?? []);
        setOpps((o as OpportunityRow[]) ?? []);
        setVerify(v);
        setEngineError(null);
      } catch (e) {
        setEngineError(String(e));
      }
    };
    load();
    loadTraces();
    const interval = setInterval(() => {
      load();
      loadTraces();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadTraces]);

  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(ENGINE_WS);
      ws.onopen = () => setWsStatus("open");
      ws.onclose = () => setWsStatus("closed");
      ws.onmessage = (msg) => {
        const parsed = JSON.parse(msg.data);
        if (parsed.type === "trace") {
          const ev = parseTrace(parsed.data);
          setLiveEvents((prev) => [...prev.slice(-199), ev]);
          setSelectedCycle(null);
        }
        if (parsed.type === "snapshot") {
          setState((prev) => ({ ...prev, ...parsed.data } as EngineState));
        }
      };
    } catch {
      setWsStatus("closed");
      return;
    }
    return () => ws.close();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold text-maya-gold">Dashboard Live</h1>
          <p className="mt-1 text-sm text-maya-parchment/55">
            Arbitraje BTC/USDT · OKX Demo + Bybit Testnet · CCXT en tiempo real
          </p>
        </div>
        <Link
          href="/methodology"
          className="rounded-lg border border-maya-turquoise/30 px-3 py-2 text-xs font-bold text-maya-turquoise hover:bg-maya-turquoise/10"
        >
          Metodología →
        </Link>
      </div>

      <LiveVerificationBanner verify={verify} wsOpen={wsStatus === "open"} />

      {engineError && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-sm">
          <p className="font-bold text-amber-300">Engine no disponible</p>
          <p className="mt-1 text-maya-parchment/70">{engineError}</p>
        </div>
      )}

      {state?.exchange_errors && Object.keys(state.exchange_errors).length > 0 && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/20 p-4">
          <p className="mb-2 text-sm font-bold text-red-300">Errores de exchange</p>
          {Object.entries(state.exchange_errors).map(([ex, err]) => (
            <p key={ex} className="text-xs text-maya-parchment/70">
              <strong>{ex}:</strong> {err}
            </p>
          ))}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Trades demo CEX" value={String(realTrades.length)} highlight />
        <Stat label="P&L acumulado" value={`$${state?.total_pnl?.toFixed(2) ?? "—"}`} />
        <Stat label="Oportunidades" value={String(state?.opportunities_count ?? opps.length)} />
        <Stat label="Execute / Reject" value={`${metrics.execute} / ${metrics.reject}`} />
      </div>

      {/* Deliberación arriba — lo primero que ven los jueces en acción */}
      <div className="mb-8 glass rounded-xl p-6">
        <h2 className="font-display mb-2 text-2xl text-maya-gold">Deliberación del consejo</h2>
        <p className="mb-4 text-xs text-maya-parchment/50">
          Votos en vivo Hunab Ku → Kinich Ahau. Cuando todos aprueban, Kukulkán envía órdenes a OKX y
          Bybit. Busca el evento <code className="text-maya-turquoise">demo_execute</code>.
        </p>
        <OpportunityDeliberation
          events={liveEvents}
          opportunities={opps}
          selectedCycleIndex={selectedCycle}
          onSelectCycle={setSelectedCycle}
        />
      </div>

      <DemoBalanceCards
        demoBalances={state?.demo_balances}
        demoTradeEnabled={state?.demo_trade_enabled}
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-xl p-6">
          <h2 className="font-display mb-4 text-lg text-maya-turquoise">Order books (CCXT live)</h2>
          {state?.books ? (
            <div className="space-y-3 text-sm">
              {Object.values(state.books).map((b) => (
                <div key={b.exchange} className="border-b border-maya-gold/10 pb-2">
                  <div className="flex justify-between font-bold capitalize text-maya-gold">
                    {b.exchange}
                    <span className="text-xs font-normal text-maya-parchment/50">{b.latency_ms}ms</span>
                  </div>
                  {b.error ? (
                    <p className="text-red-400">{b.error}</p>
                  ) : (
                    <p>
                      Bid ${b.best_bid?.toLocaleString()} · Ask ${b.best_ask?.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-maya-parchment/50">Esperando datos…</p>
          )}
        </div>
        <OpportunitiesTable rows={opps} />
      </div>

      <div className="mb-8">
        <TradeProofPanel rows={trades} verify={verify} />
      </div>

      <div className="mb-12">
        <DemoAccountPanel />
      </div>

      {/* Instrucciones al final de la página */}
      <div className="space-y-8 border-t border-maya-gold/15 pt-10">
        <HowItWorksPanel />
        <JudgeChecklist verify={verify} />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs text-maya-parchment/50">{label}</p>
      <p
        className={`font-display text-2xl font-bold ${highlight ? "text-emerald-400" : "text-maya-gold"}`}
      >
        {value}
      </p>
    </div>
  );
}

function OpportunitiesTable({ rows }: { rows: OpportunityRow[] }) {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="font-display mb-3 text-lg text-maya-turquoise">Últimas oportunidades</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-maya-parchment/50">Sin registros — mercado sin divergencia o rechazadas.</p>
      ) : (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-maya-parchment/50">
                <th className="pb-2 pr-2">Ruta</th>
                <th className="pb-2 pr-2">Bruto</th>
                <th className="pb-2">Decisión</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((o, i) => (
                <tr key={o.id ?? i} className="border-t border-maya-gold/10">
                  <td className="py-2 pr-2 capitalize">
                    {o.buy_exchange}→{o.sell_exchange}
                  </td>
                  <td className="py-2 pr-2">${Number(o.gross_profit_usd).toFixed(0)}</td>
                  <td className="py-2 font-bold text-maya-gold">{o.decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
