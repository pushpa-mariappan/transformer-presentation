import { AnimatePresence, motion } from "framer-motion";
import { useCountdown } from "../lib/useLiveSession";
import { TOKENS } from "../lib/sentence";

export const PRESENTATION_TITLE = "Inside the Transformer";
export const PRESENTATION_SUBTITLE = "How LLMs Understand and Generate Language";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function FloatingTokens() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {Array.from({ length: 18 }, (_, i) => {
        const t = TOKENS[i % TOKENS.length];
        return (
          <motion.div
            key={i}
            className="absolute rounded-lg border px-2 py-1 font-mono text-xs"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, color: t.color, borderColor: `${t.color}44`, background: `${t.color}0d` }}
            animate={{ y: [0, -30, 0], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.4 }}
          >
            {t.text}
          </motion.div>
        );
      })}
    </div>
  );
}

export function WaitingRoom({
  username,
  startsAt,
  clockOffset,
  participantCount,
  names,
  joinUrl,
}: {
  username?: string;
  startsAt: number | null;
  clockOffset: number;
  participantCount: number;
  names: string[];
  joinUrl?: string;
}) {
  const remaining = useCountdown(startsAt, clockOffset);
  const mins = remaining !== null ? Math.floor(remaining / 60000) : 0;
  const secs = remaining !== null ? Math.floor((remaining % 60000) / 1000) : 0;

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-4xl flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <FloatingTokens />
      <div className="flex flex-col gap-3">
        <div className="kicker">Waiting room</div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          <span className="gradient-text">{PRESENTATION_TITLE}</span>
        </h1>
        <p className="text-lg text-slate-300 sm:text-xl">{PRESENTATION_SUBTITLE}</p>
        {username && (
          <p className="text-slate-400">
            You're in, <b className="text-cyan-200">{username}</b>. The presentation starts on everyone's screen at once.
          </p>
        )}
      </div>

      <div className="panel flex flex-col items-center gap-2 px-8 py-6 shadow-glow-purple">
        {remaining !== null && remaining > 0 ? (
          <>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Starting in</div>
            <div className="font-mono text-6xl font-bold tabular-nums sm:text-8xl">
              <span className="gradient-text">
                {pad(mins)}:{pad(secs)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-3 w-3 rounded-full bg-cyan-300"
                  animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <div className="text-lg font-semibold text-slate-200">
              {remaining === 0 ? "Starting any moment…" : "Waiting for the presenter to start"}
            </div>
          </>
        )}
      </div>

      {joinUrl && (
        <div className="text-slate-300">
          Join at <span className="font-mono text-xl font-bold text-cyan-300">{joinUrl}</span>
        </div>
      )}

      <div className="flex w-full flex-col items-center gap-3">
        <div className="text-sm text-slate-400">
          <b className="text-2xl text-white">{participantCount}</b> participant{participantCount === 1 ? "" : "s"} in the room
        </div>
        <div className="flex max-w-3xl flex-wrap justify-center gap-2">
          <AnimatePresence>
            {names.map((n) => (
              <motion.span
                key={n}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={`rounded-full border px-3 py-1 text-sm ${
                  n === username ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                {n}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
