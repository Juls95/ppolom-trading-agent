"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectDemoAccount,
  createDemoSession,
  fetchDemoBalances,
  fetchDemoSupportedExchanges,
  fetchEngineState,
} from "@/lib/api";

const SESSION_KEY = "ppolom_demo_session";

type SupportedExchange = Record<
  string,
  { label: string; docs: string; needs_passphrase: string }
>;

type BalancesMap = Record<string, Record<string, number> | { error: string }>;

function isErrorBalance(v: unknown): v is { error: string } {
  return typeof v === "object" && v !== null && "error" in v;
}

export function DemoAccountPanel() {
  const [sessionId, setSessionId] = useState<string>("");
  const [supported, setSupported] = useState<SupportedExchange>({});
  const [balances, setBalances] = useState<BalancesMap>({});
  const [demoTradeEnabled, setDemoTradeEnabled] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forms, setForms] = useState<
    Record<string, { api_key: string; api_secret: string; passphrase: string }>
  >({});

  const ensureSession = useCallback(async () => {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      const res = await createDemoSession();
      sid = res.session_id;
      localStorage.setItem(SESSION_KEY, sid);
    }
    setSessionId(sid);
    return sid;
  }, []);

  const refresh = useCallback(async (sid: string) => {
    const [balRes, state] = await Promise.all([
      fetchDemoBalances(sid),
      fetchEngineState().catch(() => null),
    ]);
    setBalances(balRes.balances ?? {});
    if (state?.demo_trade_enabled !== undefined) {
      setDemoTradeEnabled(Boolean(state.demo_trade_enabled));
    }
    if (state?.demo_balances) {
      setBalances((prev) => {
        const merged = { ...prev };
        for (const [ex, info] of Object.entries(state.demo_balances as Record<string, { balances?: Record<string, number> }>)) {
          if (!merged[ex] && info.balances) merged[ex] = info.balances;
        }
        return merged;
      });
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const sid = await ensureSession();
        const ex = await fetchDemoSupportedExchanges();
        setSupported(ex);
        setForms((prev) => {
          const next = { ...prev };
          for (const id of Object.keys(ex)) {
            if (!next[id]) next[id] = { api_key: "", api_secret: "", passphrase: "" };
          }
          return next;
        });
        await refresh(sid);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [ensureSession, refresh]);

  const handleConnect = async (exchange: string) => {
    setError(null);
    setLoading(exchange);
    try {
      const sid = sessionId || (await ensureSession());
      const form = forms[exchange];
      await connectDemoAccount(sid, {
        exchange,
        api_key: form.api_key,
        api_secret: form.api_secret,
        passphrase: form.passphrase || undefined,
      });
      await refresh(sid);
      setForms((prev) => ({
        ...prev,
        [exchange]: { api_key: "", api_secret: "", passphrase: "" },
      }));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg text-maya-turquoise">Cuentas demo CEX</h2>
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold ${
            demoTradeEnabled ? "bg-emerald-900/50 text-emerald-300" : "bg-amber-900/40 text-amber-300"
          }`}
        >
          {demoTradeEnabled ? "DEMO_TRADE_ENABLED" : "Solo simulación interna"}
        </span>
      </div>
      <p className="mb-4 text-xs text-maya-parchment/60">
        Conecta <strong>OKX Demo Trading</strong> y <strong>Bybit Demo</strong>. OKX requiere passphrase;
        Bybit solo key + secret. Las claves viven en memoria del engine, no en Supabase.
      </p>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {Object.entries(supported).map(([id, meta]) => (
          <div key={id} className="rounded-lg border border-maya-gold/15 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold capitalize text-maya-gold">{meta.label}</span>
              <a href={meta.docs} target="_blank" rel="noreferrer" className="text-xs text-maya-turquoise underline">
                Docs
              </a>
            </div>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="API Key"
                className="w-full rounded bg-maya-obsidian/60 px-2 py-1.5 text-xs"
                value={forms[id]?.api_key ?? ""}
                onChange={(e) =>
                  setForms((prev) => ({ ...prev, [id]: { ...prev[id], api_key: e.target.value } }))
                }
              />
              <input
                type="password"
                placeholder="API Secret"
                className="w-full rounded bg-maya-obsidian/60 px-2 py-1.5 text-xs"
                value={forms[id]?.api_secret ?? ""}
                onChange={(e) =>
                  setForms((prev) => ({ ...prev, [id]: { ...prev[id], api_secret: e.target.value } }))
                }
              />
              {meta.needs_passphrase === "true" && (
                <input
                  type="password"
                  placeholder="Passphrase"
                  className="w-full rounded bg-maya-obsidian/60 px-2 py-1.5 text-xs"
                  value={forms[id]?.passphrase ?? ""}
                  onChange={(e) =>
                    setForms((prev) => ({ ...prev, [id]: { ...prev[id], passphrase: e.target.value } }))
                  }
                />
              )}
              <button
                type="button"
                disabled={loading === id}
                onClick={() => handleConnect(id)}
                className="w-full rounded bg-maya-gold/20 py-1.5 text-xs font-bold text-maya-gold hover:bg-maya-gold/30 disabled:opacity-50"
              >
                {loading === id ? "Conectando…" : `Conectar ${id}`}
              </button>
            </div>
            {balances[id] && (
              <div className="mt-3 border-t border-maya-gold/10 pt-2 text-xs">
                {isErrorBalance(balances[id]) ? (
                  <p className="text-red-400">{balances[id].error}</p>
                ) : (
                  <ul className="space-y-0.5 text-maya-parchment/80">
                    {Object.entries(balances[id] as Record<string, number>).map(([asset, amt]) => (
                      <li key={asset}>
                        {asset}: {amt.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => sessionId && refresh(sessionId)}
        className="text-xs text-maya-turquoise underline"
      >
        Refrescar balances
      </button>
      {sessionId && (
        <p className="mt-2 truncate text-[10px] text-maya-parchment/30">Session: {sessionId}</p>
      )}
    </div>
  );
}
