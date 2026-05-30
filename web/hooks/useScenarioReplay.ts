"use client";

import { useCallback, useEffect, useState } from "react";
import type { TraceEvent } from "@/lib/types";

const DEFAULT_INTERVAL_MS = 900;

export function useScenarioReplay(events: TraceEvent[], intervalMs = DEFAULT_INTERVAL_MS) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [playing, setPlaying] = useState(false);

  const reset = useCallback(() => {
    setPlaying(false);
    setVisibleCount(0);
  }, []);

  const play = useCallback(() => {
    if (events.length === 0) return;
    if (visibleCount >= events.length) setVisibleCount(0);
    setPlaying(true);
  }, [events.length, visibleCount]);

  const pause = useCallback(() => setPlaying(false), []);

  const step = useCallback(() => {
    setVisibleCount((v) => Math.min(v + 1, events.length));
  }, [events.length]);

  useEffect(() => {
    reset();
  }, [events, reset]);

  useEffect(() => {
    if (!playing) return;
    if (visibleCount >= events.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setVisibleCount((v) => v + 1), intervalMs);
    return () => clearTimeout(t);
  }, [playing, visibleCount, events.length, intervalMs]);

  return {
    visibleCount,
    playing,
    play,
    pause,
    reset,
    step,
    isComplete: events.length > 0 && visibleCount >= events.length,
    total: events.length,
  };
}
