"use client";

import { useMemo } from "react";
import { DeliberationFeed } from "@/components/council/DeliberationFeed";
import {
  groupTraceIntoCycles,
  inferCycleDecision,
  type OpportunityRow,
} from "@/lib/deliberation";
import type { TraceEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OpportunityDeliberation({
  events,
  opportunities,
  selectedCycleIndex,
  onSelectCycle,
}: {
  events: TraceEvent[];
  opportunities?: OpportunityRow[];
  selectedCycleIndex?: number | null;
  onSelectCycle?: (index: number) => void;
}) {
  const cycles = useMemo(() => groupTraceIntoCycles(events), [events]);
  const activeIndex = selectedCycleIndex ?? (cycles.length > 0 ? cycles.length - 1 : null);
  const activeCycle = activeIndex !== null ? cycles[activeIndex] : [];

  return (
    <div className="space-y-4">
      <div className="max-h-48 space-y-2 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-maya-parchment/50">
          Ciclos de deliberación ({cycles.length})
        </p>
        {cycles.length === 0 ? (
          <p className="text-sm text-maya-parchment/50">
            Sin eventos aún — el engine emite trazas cada tick del pipeline.
          </p>
        ) : (
          cycles
            .map((cycle, i) => ({ cycle, i }))
            .reverse()
            .slice(0, 12)
            .map(({ cycle, i }) => {
              const decision = inferCycleDecision(cycle);
              const agents = [...new Set(cycle.map((e) => e.agent_name))].join(" → ");
              const linked = opportunities?.find((o) => matchOpportunityToCycle(o, cycle));
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectCycle?.(i)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-xs transition",
                    activeIndex === i
                      ? "border-maya-gold bg-maya-gold/10"
                      : "border-maya-gold/15 hover:border-maya-gold/30"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-maya-gold">Ciclo #{i + 1}</span>
                    <DecisionBadge decision={decision} />
                  </div>
                  <p className="mt-1 text-maya-parchment/60">{agents}</p>
                  {linked && (
                    <p className="mt-1 text-maya-turquoise/80">
                      ↔ {linked.buy_exchange}→{linked.sell_exchange} · {linked.decision}
                    </p>
                  )}
                </button>
              );
            })
        )}
      </div>

      {activeCycle.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold text-maya-turquoise">
            Agentes · ciclo {(activeIndex ?? 0) + 1}
            <DecisionBadge decision={inferCycleDecision(activeCycle)} className="ml-2" />
          </p>
          <DeliberationFeed events={activeCycle} visibleCount={activeCycle.length} />
        </div>
      )}
    </div>
  );
}

function DecisionBadge({ decision, className }: { decision: string; className?: string }) {
  const colors: Record<string, string> = {
    EXECUTE: "text-maya-jade border-maya-jade/40",
    REJECT: "text-red-400 border-red-500/40",
    NO_ACTION: "text-maya-parchment/60 border-maya-gold/20",
    PARTIAL: "text-amber-300 border-amber-500/40",
    ERROR: "text-red-300 border-red-500/30",
    IN_PROGRESS: "text-maya-turquoise border-maya-turquoise/40",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase",
        colors[decision] ?? colors.NO_ACTION,
        className
      )}
    >
      {decision}
    </span>
  );
}

function matchOpportunityToCycle(opp: OpportunityRow, cycle: TraceEvent[]): boolean {
  if (!opp.created_at) return false;
  const oppTime = new Date(opp.created_at).getTime();
  const times = cycle
    .map((e) => (e.created_at ? new Date(e.created_at).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return false;
  const min = Math.min(...times);
  const max = Math.max(...times);
  return oppTime >= min - 2000 && oppTime <= max + 5000;
}
