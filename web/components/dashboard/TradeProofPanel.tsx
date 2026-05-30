"use client";

import { useMemo, useState } from "react";
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
  const { real, simulated } = useMemo(() => splitTrades(rows), [rows]);
  const [tab, setTab] = useState<"real" | "simulated">(real.length > 0 ? "real" : "simulated");

  const display = tab === "real" ? real : simulated;

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="border-b border-maya-gold/10 px-4 pt-4">
        <h3 className="font-display text-lg text-maya-gold">Historial de operaciones</h3>
        <p className="mb-3 text-xs text-maya-parchment/55">
          <strong className="text-emerald-400">REAL DEMO</strong> = órdenes enviadas a OKX/Bybit vía API.
          <strong className="ml-2 text-maya-parchment/50">simulated</strong> = solo paper trading interno.
        </p>
        <div className="flex gap-2">
          <TabButton
            active={tab === "real"}
            onClick={() => setTab("real")}
            label={`Trades reales (${real.length})`}
            variant="real"
          />
          <TabButton
            active={tab === "simulated"}
            onClick={() => setTab("simulated")}
            label={`Simulados (${simulated.length})`}
            variant="sim"
          />
        </div>
      </div>

      {tab === "real" && real.length === 0 && (
        <div className="border-b border-amber-500/20 bg-amber-950/20 px-4 py-3 text-xs text-amber-200/90">
          Aún no hay trades <strong>demo_cex</strong>. Posibles causas: spread real &lt; umbral $
          {verify?.min_net_profit_usd ?? 25}, fondos insuficientes en testnet, o mercado sin divergencia
          Ask &lt; Bid. Los trades <button type="button" className="underline" onClick={() => setTab("simulated")}>simulados</button> no
          aparecen en tus exchanges.
        </div>
      )}

      {display.length === 0 ? (
        <p className="p-4 text-xs text-maya-parchment/50">Sin registros en esta categoría.</p>
      ) : (
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-maya-obsidian/95">
              <tr className="text-maya-parchment/50">
                <th className="px-4 py-2">Hora</th>
                <th className="py-2 pr-2">Ruta</th>
                <th className="py-2 pr-2">Tipo</th>
                <th className="py-2 pr-2">Neto</th>
                <th className="py-2 pr-2">Prueba</th>
                <th className="py-2 pr-2">Latencia</th>
              </tr>
            </thead>
            <tbody>
              {display.slice(0, 20).map((t, i) => {
                const isReal = (t.execution_mode ?? t.status) === "demo_cex";
                return (
                  <tr key={t.id ?? i} className="border-t border-maya-gold/10">
                    <td className="px-4 py-2 text-maya-parchment/45">{fmtTime(t.created_at)}</td>
                    <td className="py-2 pr-2 capitalize">
                      {t.buy_exchange}→{t.sell_exchange}
                      <br />
                      <span className="text-maya-parchment/40">{Number(t.qty_btc ?? 0).toFixed(4)} BTC</span>
                    </td>
                    <td className="py-2 pr-2">
                      {isReal ? (
                        <span className="rounded bg-emerald-900/50 px-1.5 py-0.5 font-bold text-emerald-300">
                          REAL DEMO
                        </span>
                      ) : (
                        <span className="rounded bg-maya-parchment/10 px-1.5 py-0.5 text-maya-parchment/50">
                          simulated
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2 font-bold text-maya-gold">
                      ${Number(t.net_profit_usd ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2 pr-2 font-mono text-[10px] text-maya-parchment/60">
                      {isReal && t.details ? (
                        <span>
                          buy: {String(t.details.buy_order_id ?? "—")}
                          <br />
                          sell: {String(t.details.sell_order_id ?? "—")}
                        </span>
                      ) : (
                        "Solo motor interno"
                      )}
                    </td>
                    <td className="py-2">{t.latency_ms ?? "—"}ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  variant: "real" | "sim";
}) {
  const base = active
    ? variant === "real"
      ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
      : "border-maya-parchment/30 bg-maya-parchment/10 text-maya-parchment"
    : "border-transparent text-maya-parchment/45 hover:text-maya-parchment/70";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-0 rounded-t-lg border px-3 py-2 text-xs font-bold ${base}`}
    >
      {label}
    </button>
  );
}
