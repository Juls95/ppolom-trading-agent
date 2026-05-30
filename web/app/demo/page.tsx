"use client";

import { useCallback, useEffect, useState } from "react";
import { DeliberationFeed } from "@/components/council/DeliberationFeed";
import { fetchDemoSessions, fetchDemoSession } from "@/lib/supabase";
import type { DemoSession, TraceEvent } from "@/lib/types";
import { DemoSessionSchema, TraceEventSchema } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DemoPage() {
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [sessionMeta, setSessionMeta] = useState<DemoSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDemoSessions()
      .then((data) => {
        const parsed = data.map((d: unknown) => DemoSessionSchema.parse(d));
        setSessions(parsed);
        if (parsed.length > 0) setSelected(parsed[0].slug);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const loadSession = useCallback(async (slug: string) => {
    setError(null);
    const data = await fetchDemoSession(slug);
    if (!data) {
      setError("Sesión demo no encontrada. Ejecuta: python engine/scripts/seed_demo.py");
      return;
    }
    setSessionMeta(DemoSessionSchema.parse(data.session));
    setEvents(data.events.map((e: unknown) => TraceEventSchema.parse(e)));
  }, []);

  useEffect(() => {
    if (selected) loadSession(selected);
  }, [selected, loadSession]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-bold text-maya-gold">Demo</h1>
        <span className="demo-badge">DEMO · demo_sessions en Supabase</span>
      </div>
      <p className="mb-8 max-w-3xl text-maya-parchment/70">
        Escenarios simulados almacenados en tablas <code>demo_*</code>, separados de{" "}
        <code>live_*</code>. Cada sesión está claramente etiquetada. El dashboard en vivo usa datos
        reales de CCXT.
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!error && sessions.length === 0 && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-200">
          No hay sesiones demo en Supabase. Ejecuta desde local:{" "}
          <code className="text-maya-turquoise">PYTHONPATH=. python engine/scripts/seed_demo.py</code>
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-2">
        {sessions.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setSelected(s.slug)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm transition",
              selected === s.slug
                ? "border-maya-gold bg-maya-gold/20 text-maya-gold"
                : "border-maya-gold/20 text-maya-parchment/70 hover:border-maya-gold/40"
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {sessionMeta && (
            <div className="glass mb-6 rounded-xl p-6">
              <span className="demo-badge mb-3">{sessionMeta.badge_label}</span>
              <h2 className="font-display mt-3 text-xl font-bold">{sessionMeta.title}</h2>
              <p className="mt-2 text-sm text-maya-parchment/70">{sessionMeta.description}</p>
              <div className="mt-4 flex gap-4 text-xs text-maya-parchment/50">
                <span>Tipo: {sessionMeta.scenario_type}</span>
                <span>Resultado: {sessionMeta.outcome}</span>
                <span>Fuente: {sessionMeta.data_source}</span>
              </div>
            </div>
          )}
          <DemoPanel sessionMeta={sessionMeta} />
        </div>
        <DeliberationFeed events={events} isDemo />
      </div>
    </div>
  );
}

function DemoPanel({ sessionMeta }: { sessionMeta: DemoSession | null }) {
  if (!sessionMeta) return null;
  const isExecute = sessionMeta.outcome === "EXECUTE";
  const isReject = sessionMeta.outcome === "REJECT";
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="mb-4 font-display text-lg text-maya-turquoise">Resumen de decisión</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Metric label="Exchange compra" value={isExecute ? "kraken" : "—"} />
        <Metric label="Exchange venta" value={isExecute ? "binance" : "—"} />
        <Metric label="Precio Ask" value={isExecute ? "$69,980" : "—"} />
        <Metric label="Precio Bid" value={isExecute ? "$70,250" : "—"} />
        <Metric label="Ganancia neta" value={isExecute ? "+$109.75" : isReject ? "-$12" : "—"} />
        <Metric label="Decisión" value={sessionMeta.outcome} highlight />
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-maya-parchment/50">{label}</p>
      <p className={highlight ? "font-bold text-maya-gold" : "text-maya-parchment"}>{value}</p>
    </div>
  );
}
