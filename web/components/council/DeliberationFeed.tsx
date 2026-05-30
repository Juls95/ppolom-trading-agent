"use client";

import type { TraceEvent } from "@/lib/types";
import { AGENTS } from "@/lib/agents";
import { cn } from "@/lib/utils";

type DeliberationFeedProps = {
  events: TraceEvent[];
  isDemo?: boolean;
  /** Controlled visible count; when omitted, shows all events immediately. */
  visibleCount?: number;
  autoPlay?: boolean;
};

export function DeliberationFeed({
  events,
  isDemo,
  visibleCount,
  autoPlay = false,
}: DeliberationFeedProps) {
  const showAll = visibleCount === undefined && !autoPlay;
  const limit = visibleCount ?? (autoPlay ? 0 : events.length);
  const shown = showAll ? events : events.slice(0, limit);

  const agentColor = (id: string) => AGENTS.find((a) => a.id === id)?.color ?? "#D4AF37";

  return (
    <div className="space-y-3">
      {isDemo && (
        <div className="demo-badge mb-4">DEMO · Datos simulados</div>
      )}
      {!isDemo && <div className="live-badge mb-4">LIVE · Datos reales del engine</div>}
      {shown.length === 0 && (
        <p className="text-center text-sm text-maya-parchment/50">
          Pulsa Reproducir para ver la deliberación del consejo.
        </p>
      )}
      {shown.map((ev, i) => (
        <div
          key={ev.id ?? `${ev.agent_id}-${ev.seq ?? i}`}
          className={cn("glass animate-in rounded-lg border-l-4 p-4", ev.vote === false && "opacity-90")}
          style={{ borderLeftColor: agentColor(ev.agent_id) }}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="font-display font-bold" style={{ color: agentColor(ev.agent_id) }}>
              {ev.agent_name}
            </span>
            {ev.vote !== null && ev.vote !== undefined && (
              <span className={cn("text-xs font-bold", ev.vote ? "text-maya-jade" : "text-red-400")}>
                {ev.vote ? "✓ APROBADO" : "✗ RECHAZADO"}
              </span>
            )}
          </div>
          <p className="text-sm text-maya-parchment/90">{ev.message}</p>
          <p className="mt-1 text-xs text-maya-parchment/40">{ev.event_type}</p>
        </div>
      ))}
      {!showAll && limit < events.length && (
        <p className="text-center text-xs text-maya-parchment/40">Deliberando…</p>
      )}
    </div>
  );
}
