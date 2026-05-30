"use client";

export function SimulatedWalletNotice({ wallet }: { wallet?: Record<string, Record<string, number>> }) {
  return (
    <div className="glass rounded-xl p-6 border border-dashed border-maya-parchment/20">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-lg text-maya-parchment/70">Wallet simulada (paper)</h2>
        <span className="rounded bg-maya-parchment/10 px-2 py-0.5 text-[10px] font-bold text-maya-parchment/45">
          NO ES TU CUENTA DEMO
        </span>
      </div>
      <p className="mb-3 text-xs text-maya-parchment/50">
        Balances internos del motor para pruebas cuando no hay orden CEX. No aparecen en OKX ni Bybit.
        Para verificar fondos reales, usa las tarjetas &quot;Balances demo&quot; arriba.
      </p>
      {wallet ? (
        <pre className="max-h-32 overflow-auto text-xs text-maya-parchment/40">
          {JSON.stringify(wallet, null, 2)}
        </pre>
      ) : (
        <p className="text-xs text-maya-parchment/40">—</p>
      )}
    </div>
  );
}
