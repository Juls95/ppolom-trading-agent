import Link from "next/link";

const AGENTS = [
  { name: "Hunab Ku", domain: "Creador cósmico", task: "Monitoreo order books BTC en tiempo real" },
  { name: "Itzamná", domain: "Sabiduría, cielo", task: "Detección de oportunidades de arbitraje" },
  { name: "Chaac", domain: "Lluvia, fertilidad", task: "Costos reales: fees, slippage, retiro" },
  { name: "Ixchel", domain: "Luna, medicina", task: "Liquidez parcial y balances" },
  { name: "Kukulkán", domain: "Viento, conocimiento", task: "Ejecución (simulada + demo CEX)" },
  { name: "Kinich Ahau", domain: "Sol", task: "Registro y visualización del rendimiento" },
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display mb-2 text-4xl font-bold text-maya-gold">Metodología Ppolom</h1>
      <p className="mb-8 text-maya-parchment/70">
        Basado en la especificación del proyecto (MainRequest, Definition). Paper trading y cuentas demo —
        no es asesoría financiera.
      </p>

      <section className="mb-10 glass rounded-xl p-6">
        <h2 className="font-display mb-3 text-2xl text-maya-turquoise">Arbitraje cross-exchange</h2>
        <p className="mb-4 text-maya-parchment/80">
          Cuando el <strong>Ask</strong> (precio de compra) en un exchange es menor que el{" "}
          <strong>Bid</strong> (precio de venta) en otro, existe una oportunidad teórica: comprar barato y
          vender caro simultáneamente. Ppolom compara <strong>OKX</strong> y <strong>Bybit</strong> vía{" "}
          <strong>CCXT</strong> con datos de mercado reales.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maya-gold">
              <th className="py-2 text-left">Exchange</th>
              <th className="py-2 text-left">Acción</th>
              <th className="py-2 text-right">Precio ejemplo</th>
            </tr>
          </thead>
          <tbody className="text-maya-parchment/80">
            <tr className="border-t border-maya-gold/10">
              <td>Exchange A (ej. OKX)</td>
              <td>Comprar (Ask)</td>
              <td className="text-right">$70,000</td>
            </tr>
            <tr className="border-t border-maya-gold/10">
              <td>Exchange B (ej. Bybit)</td>
              <td>Vender (Bid)</td>
              <td className="text-right">$70,250</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4 text-maya-jade">
          Tras fees ~0.1%: ganancia neta estimada ~$109.75/BTC — solo si Chaac confirma que supera el umbral
          configurado.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-display mb-4 text-2xl text-maya-turquoise">El Consejo Maya (6 agentes)</h2>
        <p className="mb-4 text-sm text-maya-parchment/70">
          Todos deben votar <strong className="text-emerald-400">a favor</strong> para ejecutar. Flujo
          secuencial event-driven tras cada tick de mercado.
        </p>
        <div className="space-y-3">
          {AGENTS.map((a, i) => (
            <div key={a.name} className="glass flex gap-4 rounded-lg p-4">
              <span className="font-display text-2xl font-bold text-maya-gold/40">{i + 1}</span>
              <div>
                <p className="font-bold text-maya-gold">{a.name}</p>
                <p className="text-xs text-maya-turquoise">{a.domain}</p>
                <p className="text-sm text-maya-parchment/75">{a.task}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 glass rounded-xl p-6">
        <h2 className="font-display mb-3 text-xl text-maya-gold">Costos considerados (Chaac)</h2>
        <ul className="list-inside list-disc space-y-2 text-maya-parchment/80">
          <li>Trading fees por exchange (OKX ~0.08%, Bybit ~0.1% taker)</li>
          <li>Slippage estimado (default 0.05%)</li>
          <li>Fee de retiro estimado ($10 USD default)</li>
          <li>Umbral mínimo de ganancia neta (<code>MIN_NET_PROFIT_USD</code>, default $25)</li>
        </ul>
      </section>

      <section className="mb-10 glass rounded-xl p-6">
        <h2 className="font-display mb-3 text-xl text-maya-gold">Tres capas de datos (importante para jueces)</h2>
        <div className="space-y-4 text-sm text-maya-parchment/80">
          <div className="rounded-lg border border-maya-turquoise/30 p-3">
            <p className="font-bold text-maya-turquoise">1. Order books CCXT — REAL</p>
            <p>Precios públicos en tiempo real. No requiere API keys para lectura.</p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 p-3">
            <p className="font-bold text-emerald-400">2. Cuentas demo CEX — REAL</p>
            <p>
              OKX Demo Trading + Bybit Testnet. Balances y órdenes verificables en las apps oficiales.
              Trades con <code>execution_mode: demo_cex</code> incluyen order IDs.
            </p>
          </div>
          <div className="rounded-lg border border-maya-parchment/20 p-3">
            <p className="font-bold text-maya-parchment/60">3. Wallet simulada — PAPER</p>
            <p>
              Balances internos del motor (100k USDT / 2 BTC iniciales). Trades{" "}
              <code>simulated</code> no aparecen en exchanges.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display mb-3 text-2xl text-maya-turquoise">Demo vs Live vs Replay</h2>
        <ul className="list-inside list-disc space-y-2 text-maya-parchment/80">
          <li>
            <Link href="/dashboard" className="text-maya-turquoise underline">
              /dashboard
            </Link>
            : pipeline live con CCXT + cuentas demo opcionales
          </li>
          <li>
            <Link href="/demo" className="text-maya-turquoise underline">
              /demo
            </Link>
            : escenarios pre-grabados en <code>demo_*</code> tablas, badge visible, nunca mezclados con live
          </li>
          <li>
            <code>live_*</code> tablas Supabase: oportunidades, trades, trace events del motor en producción
          </li>
        </ul>
      </section>

      <section className="mb-10 glass rounded-xl p-6">
        <h2 className="font-display mb-3 text-xl text-maya-gold">Cómo verificar trades reales</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-maya-parchment/80">
          <li>Dashboard → panel &quot;Trades reales&quot; con badge verde REAL DEMO</li>
          <li>Copiar buy_order_id / sell_order_id y buscarlos en OKX Demo o Bybit Testnet</li>
          <li>Comparar balances del dashboard con las apps de cada exchange</li>
          <li>En deliberación, evento Kukulkán <code>demo_execute</code> confirma envío API</li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="font-display mb-3 text-2xl text-maya-turquoise">Stack técnico</h2>
        <ul className="list-inside list-disc space-y-1 text-maya-parchment/80">
          <li>Python 3.12 + FastAPI + CCXT (engine en Fly.io, región AMS)</li>
          <li>Next.js 14 + Supabase (web + persistencia)</li>
          <li>WebSocket para deliberación en vivo</li>
          <li>Circuit breaker por drawdown máximo configurable</li>
        </ul>
      </section>

      <p className="text-sm text-maya-parchment/50">
        Criterios de evaluación: latencia de detección, precisión del cálculo neto, robustez ante baja
        liquidez, arquitectura mantenible e interfaz clara para monitoreo (MainRequest § evaluación).
      </p>
    </div>
  );
}
