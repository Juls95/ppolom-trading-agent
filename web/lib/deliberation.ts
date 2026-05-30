import type { TraceEvent } from "@/lib/types";

/** Split trace stream into pipeline cycles (each starts at Hunab Ku monitor/error). */
export function groupTraceIntoCycles(events: TraceEvent[]): TraceEvent[][] {
  if (events.length === 0) return [];
  const groups: TraceEvent[][] = [];
  let current: TraceEvent[] = [];
  for (const ev of events) {
    const isNewCycle =
      current.length > 0 &&
      ev.agent_id === "hunab_ku" &&
      (ev.event_type === "monitor" || ev.event_type === "exchange_error");
    if (isNewCycle) {
      groups.push(current);
      current = [];
    }
    current.push(ev);
  }
  if (current.length) groups.push(current);
  return groups;
}

export function inferCycleDecision(cycle: TraceEvent[]): string {
  const kinich = cycle.find((e) => e.agent_id === "kinich_ahau");
  if (kinich?.message.toUpperCase().includes("REJECT")) return "REJECT";
  if (cycle.some((e) => e.agent_id === "kukulkan" && e.vote === true)) {
    if (cycle.some((e) => e.agent_id === "ixchel" && /parcial/i.test(e.message))) return "PARTIAL";
    return "EXECUTE";
  }
  if (cycle.some((e) => e.agent_id === "chaac" && e.vote === false)) return "REJECT";
  const itz = cycle.find((e) => e.agent_id === "itzamna" && e.event_type === "detect");
  if (itz?.vote === false && /NO_ACTION/i.test(itz.message)) return "NO_ACTION";
  if (cycle.every((e) => e.agent_id === "hunab_ku" && e.vote === false)) return "ERROR";
  return "IN_PROGRESS";
}

export type AgentVoteState = "pending" | "active" | "approved" | "rejected" | "neutral";

export function agentStatesFromEvents(
  events: TraceEvent[],
  visibleCount: number
): Record<string, AgentVoteState> {
  const visible = events.slice(0, visibleCount);
  const states: Record<string, AgentVoteState> = {};
  for (const ev of visible) {
    if (ev.vote === true) states[ev.agent_id] = "approved";
    else if (ev.vote === false) states[ev.agent_id] = "rejected";
    else states[ev.agent_id] = "neutral";
  }
  if (visibleCount > 0 && visibleCount <= events.length) {
    const last = visible[visible.length - 1];
    if (last && states[last.agent_id] !== "approved" && states[last.agent_id] !== "rejected") {
      states[last.agent_id] = "active";
    }
  }
  return states;
}

export type OpportunityRow = {
  id?: string;
  created_at?: string;
  decision: string;
  buy_exchange?: string;
  sell_exchange?: string;
  gross_profit_usd?: number | string;
  net_profit_usd?: number | string | null;
};

export function computeDecisionMetrics(opps: OpportunityRow[]) {
  let execute = 0;
  let reject = 0;
  let noAction = 0;
  let partial = 0;
  for (const o of opps) {
    const d = (o.decision ?? "").toUpperCase();
    if (d === "EXECUTE") execute += 1;
    else if (d === "REJECT") reject += 1;
    else if (d === "NO_ACTION") noAction += 1;
    else if (d === "PARTIAL") partial += 1;
  }
  const evaluated = execute + reject + partial;
  const ratio =
    evaluated > 0 ? `${Math.round((execute / evaluated) * 100)}% execute` : "—";
  const last = opps[0]?.decision ?? "—";
  return { execute, reject, noAction, partial, ratio, last };
}
