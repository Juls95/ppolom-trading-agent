"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReplayControls({
  playing,
  isComplete,
  visibleCount,
  total,
  onPlay,
  onPause,
  onReset,
  onStep,
}: {
  playing: boolean;
  isComplete: boolean;
  visibleCount: number;
  total: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!playing ? (
        <button
          type="button"
          onClick={onPlay}
          disabled={total === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-maya-gold bg-maya-gold/20 px-4 py-2 text-sm font-bold text-maya-gold transition hover:bg-maya-gold/30 disabled:opacity-40"
        >
          <Play className="h-4 w-4" aria-hidden />
          {isComplete ? "Reproducir de nuevo" : "Reproducir"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onPause}
          className="inline-flex items-center gap-2 rounded-lg border border-maya-turquoise/50 px-4 py-2 text-sm font-bold text-maya-turquoise"
        >
          <Pause className="h-4 w-4" aria-hidden />
          Pausar
        </button>
      )}
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-lg border border-maya-gold/30 px-3 py-2 text-sm text-maya-parchment/70 hover:border-maya-gold/50"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        Reiniciar
      </button>
      {onStep && (
        <button
          type="button"
          onClick={onStep}
          disabled={visibleCount >= total}
          className="inline-flex items-center gap-2 rounded-lg border border-maya-gold/20 px-3 py-2 text-sm text-maya-parchment/60 disabled:opacity-40"
        >
          <SkipForward className="h-4 w-4" aria-hidden />
          Paso
        </button>
      )}
      <span className={cn("text-xs text-maya-parchment/50")}>
        {visibleCount} / {total} eventos
      </span>
    </div>
  );
}
