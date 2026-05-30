"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgentCouncilStrip } from "@/components/council/AgentCouncilStrip";
import { DecisionSummaryPanel } from "@/components/council/DecisionSummaryPanel";
import { DeliberationFeed } from "@/components/council/DeliberationFeed";
import { ReplayControls } from "@/components/council/ReplayControls";
import { useScenarioReplay } from "@/hooks/useScenarioReplay";
import { agentStatesFromEvents } from "@/lib/deliberation";
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
  const [loading, setLoading] = useState(true);

  const replay = useScenarioReplay(events);
  const agentStates = useMemo(
    () => agentStatesFromEvents(events, replay.visibleCount),
    [events, replay.visibleCount]
  );

  useEffect(() => {
    setLoading(true);
    fetchDemoSessions()
      .then((data) => {
        const parsed = data.map((d: unknown) => DemoSessionSchema.parse(d));
        setSessions(parsed);
        if (parsed.length > 0) setSelected(parsed[0].slug);
        setError(null);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const loadSession = useCallback(async (slug: string) => {
    setError(null);
    try {
      const data = await fetchDemoSession(slug);
      if (!data) {
        setEvents([]);
        setSessionMeta(null);
        setError("Sesión demo no encontrada. Ejecuta: python engine/scripts/seed_demo.py");
        return;
      }
      setSessionMeta(DemoSessionSchema.parse(data.session));
      setEvents(data.events.map((e: unknown) => TraceEventSchema.parse(e)));
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    if (selected) loadSession(selected);
  }, [selected, loadSession]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-bold text-maya-gold">Demo</h1>
        <span className="demo-badge">DEMO · Datos simulados</span>
      </div>
      <p className="mb-8 max-w-3xl text-maya-parchment/70">
        Reproduce escenarios simulados del consejo de agentes (Hunab Ku → Kinich Ahau). Datos en tablas{" "}
        <code>demo_*</code>, separados de <code>live_*</code>.
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && !error && (
        <p className="mb-6 text-sm text-maya-parchment/50">Cargando escenarios…</p>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-200">
          No hay sesiones demo en Supabase. Ejecuta desde local:{" "}
          <code className="text-maya-turquoise">PYTHONPATH=. python engine/scripts/seed_demo.py</code>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Escenarios demo">
        {sessions.map((s) => (
          <button
            key={s.slug}
            type="button"
            role="tab"
            aria-selected={selected === s.slug}
            onClick={() => setSelected(s.slug)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm transition",
              selected === s.slug
                ? "border-maya-gold bg-maya-gold/20 text-maya-gold"
                : "border-maya-gold/20 text-maya-parchment/70 hover:border-maya-gold/40"
            )}
          >
            {s.title.replace(/^DEMO ·\s*/, "")}
          </button>
        ))}
      </div>

      {sessionMeta && (
        <div className="glass mb-6 rounded-xl p-4">
          <ReplayControls
            playing={replay.playing}
            isComplete={replay.isComplete}
            visibleCount={replay.visibleCount}
            total={replay.total}
            onPlay={replay.play}
            onPause={replay.pause}
            onReset={replay.reset}
            onStep={replay.step}
          />
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-3 font-display text-sm text-maya-turquoise">Consejo de agentes</h3>
        <AgentCouncilStrip states={agentStates} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {sessionMeta && (
            <div className="glass rounded-xl p-6">
              <span className="demo-badge mb-3">{sessionMeta.badge_label}</span>
              <h2 className="font-display mt-3 text-xl font-bold">{sessionMeta.title}</h2>
              <p className="mt-2 text-sm text-maya-parchment/70">{sessionMeta.description}</p>
            </div>
          )}
          <DecisionSummaryPanel session={sessionMeta} />
        </div>
        <div>
          <h2 className="font-display mb-4 text-xl text-maya-gold">Deliberación</h2>
          <DeliberationFeed events={events} isDemo visibleCount={replay.visibleCount} />
        </div>
      </div>
    </div>
  );
}
