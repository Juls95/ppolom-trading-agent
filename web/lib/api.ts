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
