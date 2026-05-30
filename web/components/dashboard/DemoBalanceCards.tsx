"use client";

type DemoBalanceEntry = {
  label?: string;
  balances?: Record<string, number>;
  error?: string;
};

function fmt(asset: string, amount: number) {
  const digits = asset === "USDT" ? 2 : 8;
  return `${asset}: ${amount.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
}

export function DemoBalanceCards({
  demoBalances,
  demoTradeEnabled,
}: {
  demoBalances?: Record<string, DemoBalanceEntry>;
  demoTradeEnabled?: boolean;
}) {
  const exchanges = ["okx", "bybit"];
  const hasAny = exchanges.some((ex) => demoBalances?.[ex]);

  if (!hasAny) return null;

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg text-maya-turquoise">Balances demo (OKX + Bybit)</h2>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
            demoTradeEnabled ? "bg-emerald-900/50 text-emerald-300" : "bg-amber-900/40 text-amber-300"
          }`}
        >
          {demoTradeEnabled ? "Trading demo activo" : "Solo lectura"}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {exchanges.map((ex) => {
          const entry = demoBalances?.[ex];
          return (
            <div key={ex} className="glass rounded-xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold capitalize text-maya-gold">{ex}</span>
                {entry?.label && (
                  <span className="text-[10px] text-maya-parchment/40">{entry.label}</span>
                )}
              </div>
              {entry?.error ? (
                <p className="text-xs text-red-400">{entry.error}</p>
              ) : entry?.balances && Object.keys(entry.balances).length > 0 ? (
                <ul className="space-y-1 text-sm text-maya-parchment/85">
                  {["USDT", "BTC", "ETH", "OKB"]
                    .filter((a) => entry.balances?.[a] != null)
                    .map((a) => (
                      <li key={a}>{fmt(a, entry.balances![a])}</li>
                    ))}
                  {Object.entries(entry.balances)
                    .filter(([a]) => !["USDT", "BTC", "ETH", "OKB"].includes(a))
                    .map(([a, v]) => (
                      <li key={a}>{fmt(a, v)}</li>
                    ))}
                </ul>
              ) : (
                <p className="text-xs text-maya-parchment/50">Conectado — balance vacío o pendiente de refresco</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
