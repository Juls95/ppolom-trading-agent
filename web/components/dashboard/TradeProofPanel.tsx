"use client";

import { useMemo } from "react";
import type { DemoVerifyResponse, TradeRow } from "@/lib/dashboard";
import { splitTrades } from "@/lib/dashboard";

function fmtTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function TradeProofPanel({
  rows,
  verify,
}: {
  rows: TradeRow[];
  verify: DemoVerifyResponse | null;
}) {
  const { real } = useMemo(() => splitTrades(rows), [rows]);

  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="border-b border-maya-gold/10 px-4 py-4">
        <h3 className="font-display text-lg text-maya-gold">Historial de operaciones (exchanges)</h3>
        <p className="text-xs text-maya-parchment/55">
          Órdenes enviadas a OKX Demo y Bybit Testnet. Verifica los IDs en las apps oficiales.
        </p>
      </div>

      {real.length === 0 ? (
        <div className="px-4 py-6 text-sm text-maya-parchment/60">
          <p>Aún no hay operaciones en tus cuentas demo.</p>
          <p className="mt-2 text-xs text-maya-parchment/45">
            El consejo debe aprobar una oportunidad (6 votos verdes). Umbral neto actual: $
            {verify?.min_net_profit_usd ?? 1}. Revisa la deliberación arriba.
          </p>
        </div>
      ) : (
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-maya-obsidian/95">
              <tr className="text-maya-parchment/50">
                <th className="px-4 py-2">Hora</th>
                <th className="py-2 pr-2">Ruta</th>
                <th className="py-2 pr-2">Neto</th>
                <th className="py-2 pr-2">Order IDs</th>
                <th className="py-2 pr-2">Latencia</th>
              </tr>
            </thead>
            <tbody>
              {real.slice(0, 20).map((t, i) => (
                <tr key={t.id ?? i} className="border-t border-maya-gold/10">
                  <td className="px-4 py-2 text-maya-parchment/45">{fmtTime(t.created_at)}</td>
                  <td className="py-2 pr-2 capitalize">
                    <span className="mb-1 inline-block rounded bg-emerald-900/50 px-1.5 py-0.5 font-bold text-emerald-300">
                      DEMO CEX
                    </span>
                    <br />
                    {t.buy_exchange}→{t.sell_exchange}
                    <br />
                    <span className="text-maya-parchment/40">{Number(t.qty_btc ?? 0).toFixed(4)} BTC</span>
                  </td>
                  <td className="py-2 pr-2 font-bold text-maya-gold">
                    ${Number(t.net_profit_usd ?? 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-2 font-mono text-[10px] text-maya-parchment/60">
                    {t.details ? (
                      <span>
                        buy: {String(t.details.buy_order_id ?? "—")}
                        <br />
                        sell: {String(t.details.sell_order_id ?? "—")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2">{t.latency_ms ?? "—"}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
