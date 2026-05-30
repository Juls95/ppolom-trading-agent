"use client";

import { useEffect, useState } from "react";
import { DeliberationFeed } from "@/components/council/DeliberationFeed";
import { fetchEngineState, fetchTrades, fetchOpportunities } from "@/lib/api";
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
  wallet?: Record<string, Record<string, number>>;
};

export default function DashboardPage() {
  const [state, setState] = useState<EngineState | null>(null);
  const [trades, setTrades] = useState<unknown[]>([]);
  const [opps, setOpps] = useState<unknown[]>([]);
  const [liveEvents, setLiveEvents] = useState<TraceEvent[]>([]);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed">("connecting");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, o] = await Promise.all([
          fetchEngineState(),
          fetchTrades(),
          fetchOpportunities(),
        ]);
        setState(s);
        setTrades(t);
        setOpps(o);
        setEngineError(null);
      } catch (e) {
        setEngineError(String(e));
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(ENGINE_WS);
      ws.onopen = () => setWsStatus("open");
      ws.onclose = () => setWsStatus("closed");
      ws.onmessage = (msg) => {
        const parsed = JSON.parse(msg.data);
        if (parsed.type === "trace") {
          const ev = TraceEventSchema.parse(parsed.data);
          setLiveEvents((prev) => [...prev.slice(-49), ev]);
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
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-bold text-maya-gold">Dashboard</h1>
        <span className="live-badge">LIVE · CCXT real data</span>
        <span className="text-xs text-maya-parchment/40">WS: {wsStatus}</span>
      </div>

      {engineError && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-sm">
          <p className="font-bold text-amber-300">Engine no disponible</p>
          <p className="mt-1 text-maya-parchment/70">{engineError}</p>
          <p className="mt-2 text-xs text-maya-parchment/50">
            Diagnóstico: verifica NEXT_PUBLIC_ENGINE_URL y que el servicio Fly esté activo. Usa{" "}
            <a href="/demo" className="text-maya-turquoise underline">
              /demo
            </a>{" "}
            para escenarios etiquetados mientras tanto.
          </p>
        </div>
      )}

      {state?.exchange_errors && Object.keys(state.exchange_errors).length > 0 && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/20 p-4">
          <p className="mb-2 text-sm font-bold text-red-300">Errores de exchange (datos reales)</p>
          {Object.entries(state.exchange_errors).map(([ex, err]) => (
            <p key={ex} className="text-xs text-maya-parchment/70">
              <strong>{ex}:</strong> {err}
            </p>
          ))}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="P&L acumulado" value={`$${state?.total_pnl?.toFixed(2) ?? "—"}`} />
        <Stat label="Trades" value={String(state?.trades_count ?? 0)} />
        <Stat label="Oportunidades" value={String(state?.opportunities_count ?? 0)} />
        <Stat label="Supabase" value={state?.supabase_connected ? "Conectado" : "Offline"} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-xl p-6">
          <h2 className="font-display mb-4 text-lg text-maya-turquoise">Order books (live)</h2>
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

        <div className="glass rounded-xl p-6">
          <h2 className="font-display mb-4 text-lg text-maya-turquoise">Wallets simulados</h2>
          {state?.wallet ? (
            <pre className="overflow-auto text-xs text-maya-parchment/80">
              {JSON.stringify(state.wallet, null, 2)}
            </pre>
          ) : (
            <p className="text-maya-parchment/50">—</p>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display mb-4 text-xl text-maya-gold">Deliberación en vivo</h2>
          <DeliberationFeed events={liveEvents} />
        </div>
        <div className="space-y-6">
          <DataTable title="Últimas oportunidades (live_opportunities)" rows={opps} />
          <DataTable title="Últimos trades (live_trades)" rows={trades} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs text-maya-parchment/50">{label}</p>
      <p className="font-display text-2xl font-bold text-maya-gold">{value}</p>
    </div>
  );
}

function DataTable({ title, rows }: { title: string; rows: unknown[] }) {
  return (
    <div className="glass rounded-xl p-4">
      <h3 className="mb-3 text-sm font-bold text-maya-turquoise">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-maya-parchment/50">Sin registros aún — el pipeline puede estar en NO_ACTION/REJECT.</p>
      ) : (
        <pre className="max-h-48 overflow-auto text-xs">{JSON.stringify(rows.slice(0, 5), null, 2)}</pre>
      )}
    </div>
  );
}
