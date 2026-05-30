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

function hasFunds(balances?: Record<string, number>) {
  return balances && Object.values(balances).some((v) => v > 0);
}

export function DemoBalanceCards({
  demoBalances,
  demoTradeEnabled,
}: {
  demoBalances?: Record<string, DemoBalanceEntry>;
  demoTradeEnabled?: boolean;
}) {
  const exchanges = ["okx", "bybit"];

  if (!demoTradeEnabled && !exchanges.some((ex) => demoBalances?.[ex])) {
    return null;
  }

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
          const funded = hasFunds(entry?.balances);
          return (
            <div key={ex} className="glass rounded-xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold capitalize text-maya-gold">{ex}</span>
                <span
                  className={`text-[10px] font-bold ${funded ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {entry?.error ? "Error" : funded ? "Conectado" : entry ? "Sin fondos" : "No conectado"}
                </span>
              </div>
              {entry?.error ? (
                <p className="text-xs text-red-400">{entry.error}</p>
              ) : funded && entry?.balances ? (
                <ul className="space-y-1 text-sm text-maya-parchment/85">
                  {["USDT", "BTC", "ETH", "OKB"]
                    .filter((a) => entry.balances?.[a] != null && entry.balances[a] > 0)
                    .map((a) => (
                      <li key={a}>{fmt(a, entry.balances![a])}</li>
                    ))}
                  {Object.entries(entry.balances)
                    .filter(([a, v]) => v > 0 && !["USDT", "BTC", "ETH", "OKB"].includes(a))
                    .map(([a, v]) => (
                      <li key={a}>{fmt(a, v)}</li>
                    ))}
                </ul>
              ) : ex === "bybit" ? (
                <p className="text-xs text-maya-parchment/60">
                  Cuenta testnet conectada pero vacía. Solicita USDT y BTC en{" "}
                  <a
                    href="https://testnet.bybit.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-maya-turquoise underline"
                  >
                    testnet.bybit.com
                  </a>{" "}
                  (Assets → Transfer / faucet) para ejecutar compras.
                </p>
              ) : entry ? (
                <p className="text-xs text-maya-parchment/50">Conectado — esperando fondos demo</p>
              ) : (
                <p className="text-xs text-maya-parchment/50">
                  Conecta en el panel inferior o configura keys en Fly secrets.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
