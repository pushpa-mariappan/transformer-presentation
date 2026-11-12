import { AnimatePresence, motion } from "framer-motion";
import type { LeaderboardEntry } from "../lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({
  entries,
  total,
  highlightId,
  limit = 50,
  title = "Live leaderboard",
}: {
  entries: LeaderboardEntry[];
  total: number;
  highlightId?: string;
  limit?: number;
  title?: string;
}) {
  const shown = entries.slice(0, limit);
  const mine = highlightId ? entries.find((e) => e.id === highlightId) : undefined;
  const mineHidden = mine && !shown.includes(mine);

  return (
    <div className="panel p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="kicker">{title}</div>
        <div className="font-mono text-xs text-slate-500">{entries.length} participants</div>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">No participants yet.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {[...shown, ...(mineHidden && mine ? [mine] : [])].map((e, i) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.04 }}
                className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 rounded-xl px-3 py-2 ${
                  e.id === highlightId ? "bg-gradient-to-r from-cyan-400/25 to-purple-400/20 ring-1 ring-cyan-300/60" : "bg-white/[0.03]"
                }`}
              >
                <span className="text-center font-mono text-sm font-bold text-slate-300">{e.rank <= 3 ? MEDALS[e.rank - 1] : `#${e.rank}`}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-100">
                    {e.username}
                    {e.id === highlightId && <span className="ml-1 text-xs text-cyan-300">(you)</span>}
                  </span>
                  <span className="block text-[11px] text-slate-400">{e.badge}</span>
                </span>
                <span className="font-mono text-sm font-bold text-cyan-200">
                  {e.score}
                  <span className="text-slate-500">/{total}</span>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}
