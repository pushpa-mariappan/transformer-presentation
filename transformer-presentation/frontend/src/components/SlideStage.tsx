import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { SLIDES } from "../slides";

/**
 * Renders the current slide. The visual is keyed by `replayNonce`, so a "Replay
 * animation" from the presenter remounts it and every animation restarts.
 */
export function SlideStage({
  slide,
  replayNonce,
  aside,
  compact = false,
}: {
  slide: number;
  replayNonce: number;
  aside?: ReactNode;
  compact?: boolean;
}) {
  const def = SLIDES[slide];
  if (!def) return null;
  const { Visual } = def;

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={slide}
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -60 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4"
      >
        <header className="flex flex-col gap-1">
          <div className="kicker">
            Slide {String(slide + 1).padStart(2, "0")} / {SLIDES.length} · {def.kicker}
          </div>
          <h1 className={`font-extrabold tracking-tight ${compact ? "text-2xl" : "text-3xl sm:text-4xl xl:text-5xl"}`}>
            <span className="gradient-text">{def.title}</span>
          </h1>
        </header>

        <div className={`grid gap-4 ${compact ? "" : "xl:grid-cols-[minmax(0,1fr)_360px]"}`}>
          <div className="panel min-w-0 p-3 sm:p-5">
            <Visual key={replayNonce} />
          </div>
          <div className="flex flex-col gap-4">
            <div className="panel p-4 sm:p-5">
              <div className="kicker mb-3">Key ideas</div>
              <ul className="flex flex-col gap-2.5">
                {def.points.map((p, i) => (
                  <motion.li
                    key={`${replayNonce}-${i}`}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                    className="flex gap-2.5 text-sm leading-relaxed text-slate-200 sm:text-[15px]"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
                    <span>{p}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            {aside}
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
