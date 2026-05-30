import { AGENTS } from "@/lib/agents";

export function AgentCard({ agent }: { agent: (typeof AGENTS)[number] }) {
  return (
    <div className="glass rounded-xl p-5 transition hover:border-maya-gold/40">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {agent.glyph}
        </span>
        <div>
          <h3 className="font-display text-lg font-bold" style={{ color: agent.color }}>
            {agent.name}
          </h3>
          <p className="text-xs text-maya-parchment/60">{agent.domain}</p>
        </div>
      </div>
      <p className="mb-2 text-sm font-medium text-maya-turquoise">{agent.role}</p>
      <p className="text-xs text-maya-parchment/70">{agent.importance}</p>
    </div>
  );
}

export function AgentGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {AGENTS.map((a) => (
        <AgentCard key={a.id} agent={a} />
      ))}
    </div>
  );
}
