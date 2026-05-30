"use client";

import { useState } from "react";
import Link from "next/link";

const AGENTS = [
  {
    id: "hunab_ku",
    name: "Hunab Ku",
    role: "Monitoreo order books",
    desc: "Lee precios Ask/Bid en OKX y Bybit vía CCXT (~500ms). Sin datos frescos no hay arbitraje.",
  },
  {
    id: "itzamna",
    name: "Itzamná",
    role: "Detectar oportunidad",
    desc: "Si Ask(A) < Bid(B), hay divergencia: comprar barato, vender caro.",
  },
  {
    id: "chaac",
    name: "Chaac",
    role: "Costos netos",
    desc: "Resta fees, slippage y fee de retiro. Solo aprueba si neto ≥ umbral ($25 default).",
  },
  {
    id: "ixchel",
    name: "Ixchel",
    role: "Liquidez",
    desc: "Verifica USDT/BTC en cuentas demo reales (o wallet simulada). Mínimo 0.001 BTC.",
  },
  {
    id: "kukulkan",
    name: "Kukulkán",
    role: "Ejecutar",
    desc: "Simula internamente y, si hay keys, envía órdenes market a OKX Demo + Bybit Testnet.",
  },
  {
    id: "kinich_ahau",
    name: "Kinich Ahau",
    role: "Registrar",
    desc: "Guarda en Supabase (live_trades) con execution_mode: demo_cex o simulated.",
  },
];

export function HowItWorksPanel() {
  const [open, setOpen] = useState(true);

  return (
    <div className="glass mb-8 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-white/5"
      >
        <div>
          <h2 className="font-display text-lg text-maya-gold">¿Cómo funciona Ppolom?</h2>
          <p className="text-xs text-maya-parchment/50">
            Consejo Maya · 6 agentes · unanimidad requerida para ejecutar
          </p>
        </div>
        <span className="text-maya-turquoise">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-maya-gold/10 px-6 pb-6">
          <div className="mb-6 mt-4 rounded-lg border border-maya-turquoise/20 bg-maya-turquoise/5 p-4 text-sm text-maya-parchment/85">
            <p className="mb-2 font-bold text-maya-turquoise">Ejemplo de arbitraje (MainRequest)</p>
            <p>
              Comprar BTC en exchange A al Ask ($70,000) y vender en B al Bid ($70,250). Tras fees ~0.1%,
              la ganancia neta puede ser ~$109/BTC — si Chaac confirma que supera el umbral.
            </p>
          </div>

          <div className="space-y-3">
            {AGENTS.map((a, i) => (
              <div key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maya-gold/20 text-xs font-bold text-maya-gold">
                    {i + 1}
                  </span>
                  {i < AGENTS.length - 1 && <div className="mt-1 h-full w-px bg-maya-gold/20" />}
                </div>
                <div className="pb-3">
                  <p className="font-bold text-maya-gold">
                    {a.name}{" "}
                    <span className="text-xs font-normal text-maya-turquoise">— {a.role}</span>
                  </p>
                  <p className="text-xs text-maya-parchment/65">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <Link href="/methodology" className="text-maya-turquoise underline">
              Metodología completa →
            </Link>
            <Link href="/demo" className="text-maya-turquoise underline">
              Escenarios demo etiquetados →
            </Link>
            <Link href="/council" className="text-maya-turquoise underline">
              Foro del consejo →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
