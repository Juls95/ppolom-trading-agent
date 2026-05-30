import { z } from "zod";

export const TraceEventSchema = z.object({
  id: z.string().optional(),
  agent_id: z.string(),
  agent_name: z.string(),
  event_type: z.string(),
  vote: z.boolean().nullable().optional(),
  message: z.string(),
  payload: z.record(z.unknown()).optional(),
  created_at: z.string().optional(),
  seq: z.number().optional(),
});

export const DemoSessionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  scenario_type: z.string(),
  data_source: z.string(),
  is_demo: z.boolean(),
  badge_label: z.string(),
  outcome: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type TraceEvent = z.infer<typeof TraceEventSchema>;
export type DemoSession = z.infer<typeof DemoSessionSchema>;

export const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:8000";
export const ENGINE_WS = process.env.NEXT_PUBLIC_ENGINE_WS ?? "ws://localhost:8000/ws";
