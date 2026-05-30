"use client";

import type { DemoSession } from "@/lib/types";
import { cn } from "@/lib/utils";

const OUTCOME_STYLES: Record<string, string> = {
  EXECUTE: "text-maya-jade",
  REJECT: "text-red-400",
  NO_ACTION: "text-maya-parchment/70",
  PARTIAL: "text-amber-300",
  ERROR: "text-red-300",
};

export function DecisionSummaryPanel({ session }: { session: DemoSession | null }) {
  if (!session) return null;

  const outcome = session.outcome;
  const isExecute = outcome === "EXECUTE";
  const isReject = outcome === "REJECT";
  const isPartial = outcome === "PARTIAL";
  const meta = session.metadata ?? {};

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="mb-4 font-display text-lg text-maya-turquoise">Resumen de decisión</h3>
      <div
        className={cn(
          "mb-4 rounded-lg border px-4 py-3 text-center font-display text-2xl font-bold",
          OUTCOME_STYLES[outcome] ?? "text-maya-gold"
        )}
      >
        {outcome}
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Metric label="Tipo escenario" value={session.scenario_type} />
        <Metric label="Fuente" value={session.data_source} />
        <Metric
          label="Exchange compra"
          value={isExecute || isPartial ? String((meta.exchanges as string[])?.[0] ?? "kraken") : "—"}
        />
        <Metric
          label="Exchange venta"
          value={isExecute || isPartial ? String((meta.exchanges as string[])?.[1] ?? "binance") : "—"}
        />
        <Metric label="Ganancia neta" value={isExecute ? "+$109.75" : isReject ? "-$12" : isPartial ? "parcial" : "—"} />
        <Metric label="Decisión final" value={outcome} highlight />
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
