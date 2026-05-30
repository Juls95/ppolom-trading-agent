import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url && key);

export const supabase = supabaseConfigured
  ? createClient(url, key)
  : null;

export async function fetchDemoSessions() {
  if (supabase) {
    const { data, error } = await supabase.from("demo_sessions").select("*").order("created_at");
    if (error) throw new Error(`Supabase demo_sessions: ${error.message}`);
    return data ?? [];
  }
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL ?? "";
  if (!engineUrl) throw new Error("NEXT_PUBLIC_ENGINE_URL no configurada en el build");
  const res = await fetch(`${engineUrl}/demo/sessions`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Engine /demo/sessions: ${res.status}`);
  return res.json();
}

export async function fetchDemoSession(slug: string) {
  if (supabase) {
    const { data: session, error: sessionErr } = await supabase
      .from("demo_sessions")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (sessionErr) throw new Error(`Supabase demo_sessions: ${sessionErr.message}`);
    if (!session) return null;
    const { data: events, error: eventsErr } = await supabase
      .from("demo_trace_events")
      .select("*")
      .eq("session_id", session.id)
      .order("seq");
    if (eventsErr) throw new Error(`Supabase demo_trace_events: ${eventsErr.message}`);
    return { session, events: events ?? [] };
  }
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL ?? "";
  if (!engineUrl) throw new Error("NEXT_PUBLIC_ENGINE_URL no configurada en el build");
  const res = await fetch(`${engineUrl}/demo/sessions/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.error) return null;
  return { session: json.session, events: json.events ?? [] };
}

export async function fetchLiveTraceEvents(limit = 100) {
  if (supabase) {
    const { data, error } = await supabase
      .from("live_trace_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase live_trace_events: ${error.message}`);
    return [...(data ?? [])].reverse();
  }
  const { fetchTraceEvents } = await import("./api");
  return fetchTraceEvents(limit);
}
