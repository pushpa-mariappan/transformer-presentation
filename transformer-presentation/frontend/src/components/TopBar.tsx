import type { ReactNode } from "react";

export function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400" title={connected ? "Connected" : "Reconnecting…"}>
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "animate-pulse bg-amber-400"}`} />
      <span className="hidden sm:inline">{connected ? "Live" : "Reconnecting…"}</span>
    </span>
  );
}

export function TopBar({
  connected,
  slide,
  totalSlides,
  right,
}: {
  connected: boolean;
  slide?: number;
  totalSlides?: number;
  right?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <span className="text-lg">🧠</span>
        <span className="hidden font-semibold text-slate-200 sm:inline">Inside the Transformer</span>
        <ConnectionDot connected={connected} />
        {slide !== undefined && totalSlides !== undefined && (
          <div className="ml-2 hidden flex-1 items-center gap-1 md:flex">
            {Array.from({ length: totalSlides }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i < slide ? "bg-purple-400/60" : i === slide ? "bg-cyan-300" : "bg-white/10"}`}
              />
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">{right}</div>
      </div>
    </div>
  );
}
