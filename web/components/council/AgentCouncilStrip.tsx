"use client";

import { motion } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import type { AgentVoteState } from "@/lib/deliberation";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<AgentVoteState, string> = {
  pending: "border-maya-gold/15 opacity-40",
  active: "border-maya-turquoise ring-1 ring-maya-turquoise/50",
  approved: "border-maya-jade/60 bg-maya-jade/10",
  rejected: "border-red-500/50 bg-red-950/30",
  neutral: "border-maya-gold/30 bg-maya-gold/5",
};

const STATE_LABEL: Record<AgentVoteState, string> = {
  pending: "—",
  active: "…",
  approved: "✓",
  rejected: "✗",
  neutral: "·",
};

export function AgentCouncilStrip({ states }: { states: Record<string, AgentVoteState> }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {AGENTS.map((agent) => {
        const state: AgentVoteState = states[agent.id] ?? "pending";
        return (
          <motion.div
            key={agent.id}
            layout
            className={cn("rounded-lg border p-2 text-center transition", STATE_STYLES[state])}
            animate={state === "active" ? { scale: [1, 1.02, 1] } : { scale: 1 }}
            transition={{ repeat: state === "active" ? Infinity : 0, duration: 1.2 }}
          >
            <span className="text-lg" aria-hidden>
              {agent.glyph}
            </span>
            <p className="mt-1 truncate font-display text-xs font-bold" style={{ color: agent.color }}>
              {agent.name.split(" ")[0]}
            </p>
            <p
              className={cn(
                "text-xs font-bold",
                state === "approved" && "text-maya-jade",
                state === "rejected" && "text-red-400",
                state === "active" && "text-maya-turquoise"
              )}
            >
              {STATE_LABEL[state]}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
