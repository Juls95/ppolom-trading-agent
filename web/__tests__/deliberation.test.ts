import { groupTraceIntoCycles, inferCycleDecision, computeDecisionMetrics } from "@/lib/deliberation";
import type { TraceEvent } from "@/lib/types";

const ev = (
  agent_id: string,
  event_type: string,
  vote: boolean | null,
  message: string
): TraceEvent => ({
  agent_id,
  agent_name: agent_id,
  event_type,
  vote: vote ?? undefined,
  message,
});

describe("groupTraceIntoCycles", () => {
  it("splits on hunab_ku monitor boundaries", () => {
    const events = [
      ev("hunab_ku", "monitor", true, "tick 1"),
      ev("itzamna", "detect", false, "NO_ACTION"),
      ev("hunab_ku", "monitor", true, "tick 2"),
      ev("itzamna", "detect", true, "opp"),
      ev("chaac", "costs", false, "reject"),
    ];
    const groups = groupTraceIntoCycles(events);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveLength(2);
    expect(groups[1]).toHaveLength(3);
  });
});

describe("inferCycleDecision", () => {
  it("detects REJECT from chaac", () => {
    const cycle = [
      ev("hunab_ku", "monitor", true, "ok"),
      ev("itzamna", "detect", true, "opp"),
      ev("chaac", "costs", false, "net negative"),
    ];
    expect(inferCycleDecision(cycle)).toBe("REJECT");
  });
});

describe("computeDecisionMetrics", () => {
  it("counts decisions", () => {
    const m = computeDecisionMetrics([
      { decision: "EXECUTE" },
      { decision: "REJECT" },
      { decision: "REJECT" },
    ]);
    expect(m.execute).toBe(1);
    expect(m.reject).toBe(2);
    expect(m.last).toBe("EXECUTE");
  });
});
