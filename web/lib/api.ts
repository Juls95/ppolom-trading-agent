import { ENGINE_URL } from "./types";

export async function fetchEngineState() {
  const res = await fetch(`${ENGINE_URL}/state`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Engine unreachable: ${res.status}`);
  return res.json();
}

export async function fetchAgents() {
  const res = await fetch(`${ENGINE_URL}/agents`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchTrades() {
  const res = await fetch(`${ENGINE_URL}/trades`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchOpportunities() {
  const res = await fetch(`${ENGINE_URL}/opportunities`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchTraceEvents(limit = 100) {
  const res = await fetch(`${ENGINE_URL}/trace-events?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function createDemoSession() {
  const res = await fetch(`${ENGINE_URL}/demo/session`, { method: "POST" });
  if (!res.ok) throw new Error(`Demo session failed: ${res.status}`);
  return res.json() as Promise<{ session_id: string }>;
}

export async function fetchDemoSupportedExchanges() {
  const res = await fetch(`${ENGINE_URL}/demo/supported-exchanges`, { cache: "no-store" });
  if (!res.ok) return {};
  return res.json();
}

export async function connectDemoAccount(
  sessionId: string,
  body: { exchange: string; api_key: string; api_secret: string; passphrase?: string }
) {
  const res = await fetch(`${ENGINE_URL}/demo/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Demo-Session": sessionId,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Connect failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchDemoBalances(sessionId: string) {
  const res = await fetch(`${ENGINE_URL}/demo/balances`, {
    cache: "no-store",
    headers: { "X-Demo-Session": sessionId },
  });
  if (!res.ok) throw new Error(`Balances failed: ${res.status}`);
  return res.json() as Promise<{ session_id: string; balances: Record<string, Record<string, number>> }>;
}
