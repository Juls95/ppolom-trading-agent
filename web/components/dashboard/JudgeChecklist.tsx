"use client";

import type { DemoVerifyResponse } from "@/lib/dashboard";

const STEPS = [
  {
    title: "1. Confirma cuentas demo conectadas",
    body: "Arriba deben aparecer OKX Demo y Bybit Testnet en verde. Los balances vienen de la API real del exchange, no de la simulación.",
  },
  {
    title: "2. Cruza balances con las apps",
    body: "Abre OKX Demo Trading y Bybit Testnet en otra pestaña. Los USDT/BTC deben coincidir con las tarjetas de este dashboard.",
  },
  {
    title: "3. Busca trades con badge REAL DEMO",
    body: 'En la tabla inferior, filtra "Trades reales". Cada fila demo_cex incluye order IDs que puedes buscar en el historial del exchange.',
  },
  {
    title: "4. Verifica en el exchange",
    body: "Usa los enlaces externos para ver órdenes spot en OKX Demo y Bybit Testnet. Si no hay trades reales aún, el mercado puede no superar el umbral de $25 neto.",
  },
];

export function JudgeChecklist({ verify }: { verify: DemoVerifyResponse | null }) {
  const links = verify?.verify_links ?? {};

  return (
    <div className="glass rounded-xl p-6">
      <h2 className="font-display mb-2 text-lg text-maya-turquoise">Guía rápida para jueces</h2>
      <p className="mb-4 text-xs text-maya-parchment/55">
        Sigue estos pasos para comprobar que no es solo una simulación visual.
      </p>
      <ol className="space-y-4">
        {STEPS.map((s) => (
          <li key={s.title} className="border-l-2 border-maya-gold/30 pl-3">
            <p className="text-sm font-bold text-maya-gold">{s.title}</p>
            <p className="text-xs text-maya-parchment/70">{s.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-5 space-y-2 border-t border-maya-gold/10 pt-4">
        <p className="text-xs font-bold text-maya-parchment/60">Verificar en exchanges (abrir en nueva pestaña)</p>
        <div className="flex flex-wrap gap-2">
          {links.okx_demo_trading && (
            <ExtLink href={links.okx_demo_trading}>OKX Demo — trading</ExtLink>
          )}
          {links.okx_demo_assets && <ExtLink href={links.okx_demo_assets}>OKX Demo — balances</ExtLink>}
          {links.bybit_testnet_orders && (
            <ExtLink href={links.bybit_testnet_orders}>Bybit — historial órdenes</ExtLink>
          )}
          {links.bybit_testnet_assets && (
            <ExtLink href={links.bybit_testnet_assets}>Bybit — assets</ExtLink>
          )}
        </div>
      </div>
    </div>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded border border-maya-turquoise/30 bg-maya-turquoise/10 px-2 py-1 text-[10px] font-bold text-maya-turquoise hover:bg-maya-turquoise/20"
    >
      {children} ↗
    </a>
  );
}
