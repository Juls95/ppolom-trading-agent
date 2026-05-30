"use client";

import type { DemoVerifyResponse } from "@/lib/dashboard";

const LAYER_STYLES = {
  market: "border-maya-turquoise/40 bg-maya-turquoise/10",
  demo_cex: "border-emerald-500/40 bg-emerald-950/30",
  simulated: "border-maya-parchment/20 bg-maya-obsidian/40",
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

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-maya-gold/25 bg-gradient-to-br from-maya-obsidian/90 to-maya-obsidian/50">
      <div className="border-b border-maya-gold/15 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-bold text-maya-gold">Panel de verificación en vivo</h2>
          <span className="live-badge">LIVE</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              wsOpen ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/40 text-red-300"
            }`}
          >
            WebSocket {wsOpen ? "conectado" : "desconectado"}
          </span>
          {demoEnabled ? (
            <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              DEMO_TRADE_ENABLED
            </span>
          ) : (
            <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              Solo simulación interna
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-maya-parchment/70">
          Tres capas de datos — los jueces pueden distinguir qué es real (CCXT + cuentas demo) vs simulado
          (wallet interna).
        </p>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-3">
        {(verify?.data_layers ?? []).map((layer) => (
          <div
            key={layer.id}
            className={`rounded-xl border p-4 ${LAYER_STYLES[layer.id as keyof typeof LAYER_STYLES] ?? LAYER_STYLES.simulated}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-maya-parchment">{layer.label}</span>
              <span
                className={`text-[10px] font-bold uppercase ${
                  layer.is_simulated ? "text-maya-parchment/50" : "text-emerald-400"
                }`}
              >
                {layer.is_simulated ? "Simulado" : "Real"}
              </span>
            </div>
            <p className="text-xs text-maya-parchment/65">{layer.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 border-t border-maya-gold/10 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="OKX Demo" value={okxOk ? "Conectado" : "No conectado"} ok={okxOk} />
        <MiniStat label="Bybit Testnet" value={bybitOk ? "Conectado" : "No conectado"} ok={bybitOk} />
        <MiniStat label="Trades reales demo" value={String(realTrades)} ok={realTrades > 0} />
        <MiniStat
          label="Trades simulados"
          value={String(verify?.trade_stats?.simulated ?? 0)}
          ok={false}
          muted
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  ok,
  muted,
}: {
  label: string;
  value: string;
  ok?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-maya-parchment/45">{label}</p>
      <p
        className={`font-display text-lg font-bold ${
          muted ? "text-maya-parchment/50" : ok ? "text-emerald-400" : "text-amber-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
