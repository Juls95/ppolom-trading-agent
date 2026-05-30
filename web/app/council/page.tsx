import { AgentGrid } from "@/components/agents/AgentCard";
import { AGENTS } from "@/lib/agents";

export default function CouncilPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display mb-2 text-4xl font-bold text-maya-gold">Consejo Maya</h1>
      <p className="mb-8 max-w-2xl text-maya-parchment/70">
        Foro de deliberación donde cada dios evalúa una dimensión del arbitraje. En producción, los
        mensajes provienen del pipeline en tiempo real. En demo, escenarios etiquetados en{" "}
        <code className="text-maya-turquoise">demo_sessions</code>.
      </p>

      <div className="mb-12 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-maya-gold/20 text-maya-gold">
              <th className="py-3 pr-4">Agente</th>
              <th className="py-3 pr-4">Dominio</th>
              <th className="py-3 pr-4">Responsabilidad</th>
              <th className="py-3">Importancia</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((a) => (
              <tr key={a.id} className="border-b border-maya-gold/10">
                <td className="py-3 pr-4 font-display font-bold" style={{ color: a.color }}>
                  {a.glyph} {a.name}
                </td>
                <td className="py-3 pr-4 text-maya-parchment/70">{a.domain}</td>
                <td className="py-3 pr-4">{a.role}</td>
                <td className="py-3 text-maya-parchment/60">{a.importance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-display mb-6 text-2xl font-bold">Tarjetas de agente</h2>
      <AgentGrid />
    </div>
  );
}
