import { ENGINE_URL } from "./types";

export type TradeRow = {
  id?: string;
  buy_exchange?: string;
  sell_exchange?: string;
  qty_btc?: number;
  net_profit_usd?: number;
  latency_ms?: number;
  status?: string;
  execution_mode?: string;
  details?: Record<string, unknown>;
  created_at?: string;
};

export type DemoVerifyResponse = {
  demo_trade_enabled: boolean;
  exchanges_monitored: string[];
  symbol: string;
  min_net_profit_usd: number;
  accounts: Record<
    string,
    {
      connected: boolean;
      label?: string | null;
      balances?: Record<string, number>;
      error?: string | null;
      meta?: { label: string; docs: string };
    }
  >;
  trade_stats: { demo_cex: number; simulated: number; total: number };
  recent_demo_trades: TradeRow[];
  verify_links: Record<string, string>;
  data_layers: Array<{
    id: string;
    label: string;
    description: string;
    is_simulated: boolean;
  }>;
};

export function splitTrades(rows: TradeRow[]) {
  const real = rows.filter((t) => (t.execution_mode ?? t.status) === "demo_cex");
  const simulated = rows.filter((t) => (t.execution_mode ?? t.status) !== "demo_cex");
  return { real, simulated };
}

export async function fetchDemoVerify(): Promise<DemoVerifyResponse | null> {
  const res = await fetch(`${ENGINE_URL}/demo/verify`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
