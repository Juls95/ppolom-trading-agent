"use client";

import type { DemoVerifyResponse } from "@/lib/dashboard";

const LAYER_STYLES = {
  market: "border-maya-turquoise/40 bg-maya-turquoise/10",
  demo_cex: "border-emerald-500/40 bg-emerald-950/30",
};

export function LiveVerificationBanner({
  verify,
  wsOpen,
}: {
  verify: DemoVerifyResponse | null;
  wsOpen: boolean;
}) {
  const okxOk = verify?.accounts?.okx?.connected && !verify.accounts.okx.error;
  const bybitOk = verify?.accounts?.bybit?.connected && !verify.accounts.bybit.error;
  const demoEnabled = verify?.demo_trade_enabled;
  const realTrades = verify?.trade_stats?.demo_cex ?? 0;

  const layers = (verify?.data_layers ?? []).filter((l) => !l.is_simulated);

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-maya-gold/25 bg-gradient-to-br from-maya-obsidian/90 to-maya-obsidian/50">
      <div className="border-b border-maya-gold/15 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-bold text-maya-gold">Estado en vivo</h2>
          <span className="live-badge">LIVE</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              wsOpen ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/40 text-red-300"
            }`}
          >
            WebSocket {wsOpen ? "conectado" : "desconectado"}
          </span>
          {demoEnabled && (
            <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Cuentas demo activas
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-maya-parchment/70">
          Datos CCXT reales y cuentas demo OKX + Bybit conectadas vía API.
        </p>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`rounded-xl border p-4 ${LAYER_STYLES[layer.id as keyof typeof LAYER_STYLES] ?? LAYER_STYLES.market}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-maya-parchment">{layer.label}</span>
              <span className="text-[10px] font-bold uppercase text-emerald-400">En vivo</span>
            </div>
            <p className="text-xs text-maya-parchment/65">{layer.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 border-t border-maya-gold/10 px-6 py-4 sm:grid-cols-3">
        <MiniStat label="OKX Demo" value={okxOk ? "Conectado" : "No conectado"} ok={okxOk} />
        <MiniStat label="Bybit Testnet" value={bybitOk ? "Conectado" : "No conectado"} ok={bybitOk} />
        <MiniStat label="Trades en exchanges" value={String(realTrades)} ok={realTrades > 0} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded-lg bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-maya-parchment/45">{label}</p>
      <p className={`font-display text-lg font-bold ${ok ? "text-emerald-400" : "text-amber-400"}`}>
        {value}
      </p>
    </div>
  );
}
