export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose-invert">
      <h1 className="font-display mb-6 text-4xl font-bold text-maya-gold">Metodología</h1>

      <section className="mb-10">
        <h2 className="font-display mb-3 text-2xl text-maya-turquoise">Arbitraje cross-exchange</h2>
        <p className="text-maya-parchment/80">
          Cuando el Ask de un exchange es menor que el Bid de otro, existe una oportunidad teórica.
          Compramos en el exchange barato y vendemos en el caro. Ppolom compara Binance, OKX y Kraken
          vía CCXT con datos reales.
        </p>
      </section>

      <section className="mb-10 glass rounded-xl p-6">
        <h2 className="font-display mb-3 text-xl text-maya-gold">Ejemplo (MainRequest)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maya-gold">
              <th className="py-2 text-left">Exchange</th>
              <th className="py-2 text-left">Acción</th>
              <th className="py-2 text-right">Precio</th>
            </tr>
          </thead>
          <tbody className="text-maya-parchment/80">
            <tr>
              <td>Kraken</td>
              <td>Comprar (Ask)</td>
              <td className="text-right">$70,000</td>
            </tr>
            <tr>
              <td>Binance</td>
              <td>Vender (Bid)</td>
              <td className="text-right">$70,250</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4 text-maya-jade">Ganancia neta estimada: +$109.75 / BTC (tras fees 0.1%)</p>
      </section>

      <section className="mb-10">
        <h2 className="font-display mb-3 text-2xl text-maya-turquoise">Costos considerados (Chaac)</h2>
        <ul className="list-inside list-disc space-y-2 text-maya-parchment/80">
          <li>Trading fees por exchange (Binance 0.1%, OKX 0.08%, Kraken 0.26%)</li>
          <li>Slippage estimado (depth walk)</li>
          <li>Fee de retiro estimado ($10 USD default)</li>
          <li>Umbral mínimo de ganancia neta configurable</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-display mb-3 text-2xl text-maya-turquoise">Separación demo vs live</h2>
        <ul className="list-inside list-disc space-y-2 text-maya-parchment/80">
          <li>
            <code>live_*</code> tablas: datos reales del pipeline CCXT
          </li>
          <li>
            <code>demo_*</code> tablas: escenarios simulados, badge visible, nunca mezclados
          </li>
        </ul>
      </section>

      <p className="text-sm text-maya-parchment/50">
        Paper mode only. No se ejecutan órdenes reales. No es asesoría financiera.
      </p>
    </div>
  );
}
