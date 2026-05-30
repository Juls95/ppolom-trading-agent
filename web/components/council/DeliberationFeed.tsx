"use client";

import { useEffect, useState } from "react";
import type { TraceEvent } from "@/lib/types";
import { AGENTS } from "@/lib/agents";
import { cn } from "@/lib/utils";

export function DeliberationFeed({ events, isDemo }: { events: TraceEvent[]; isDemo?: boolean }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    if (events.length === 0) return;
    const t = setInterval(() => {
      setVisible((v) => {
        if (v >= events.length) {
          clearInterval(t);
          return v;
        }
        return v + 1;
      });
    }, 800);
    return () => clearInterval(t);
  }, [events]);

  const agentColor = (id: string) => AGENTS.find((a) => a.id === id)?.color ?? "#D4AF37";

  return (
    <div className="space-y-3">
      {isDemo && (
        <div className="demo-badge mb-4">DEMO · Datos simulados almacenados en demo_sessions</div>
      )}
      {!isDemo && <div className="live-badge mb-4">LIVE · Datos reales del engine</div>}
      {events.slice(0, visible).map((ev, i) => (
        <div
          key={ev.id ?? i}
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
      {visible < events.length && (
        <p className="text-center text-xs text-maya-parchment/40">Deliberando…</p>
      )}
    </div>
  );
}
