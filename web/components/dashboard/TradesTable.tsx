"use client";

type TradeRow = {
  id?: string;
  buy_exchange?: string;
  sell_exchange?: string;
  qty_btc?: number;
  net_profit_usd?: number;
  latency_ms?: number;
  status?: string;
  execution_mode?: string;
  details?: Record<string, unknown>;
  created_at?: string;
};

export function TradesTable({ rows }: { rows: TradeRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="glass rounded-xl p-4">
        <h3 className="mb-3 text-sm font-bold text-maya-turquoise">Trades de arbitraje</h3>
        <p className="text-xs text-maya-parchment/50">Sin trades aún.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="mb-3 text-sm font-bold text-maya-turquoise">Trades de arbitraje</h3>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-maya-parchment/50">
              <th className="pb-2 pr-2">Ruta</th>
              <th className="pb-2 pr-2">Modo</th>
              <th className="pb-2 pr-2">Neto</th>
              <th className="pb-2 pr-2">IDs demo</th>
              <th className="pb-2">Latencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((t, i) => (
              <tr key={t.id ?? i} className="border-t border-maya-gold/10">
                <td className="py-2 pr-2 capitalize">
                  {t.buy_exchange}→{t.sell_exchange}
                </td>
                <td className="py-2 pr-2">
                  <span
                    className={
                      t.execution_mode === "demo_cex"
                        ? "font-bold text-emerald-400"
                        : "text-maya-parchment/70"
                    }
                  >
                    {t.execution_mode ?? t.status ?? "—"}
                  </span>
                </td>
                <td className="py-2 pr-2">${Number(t.net_profit_usd ?? 0).toFixed(2)}</td>
                <td className="py-2 pr-2 font-mono text-[10px] text-maya-parchment/60">
                  {t.execution_mode === "demo_cex" && t.details
                    ? `${String(t.details.buy_order_id ?? "—")} / ${String(t.details.sell_order_id ?? "—")}`
                    : "—"}
                </td>
                <td className="py-2">{t.latency_ms ?? "—"}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
