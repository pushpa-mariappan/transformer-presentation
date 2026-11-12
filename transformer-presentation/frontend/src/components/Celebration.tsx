import { motion } from "framer-motion";
import { Confetti } from "./Confetti";
import { Leaderboard } from "./Leaderboard";
import type { LeaderboardEntry, Me } from "../lib/types";

function badgeFor(pct: number) {
  if (pct === 1) return { title: "Transformer Architect", emoji: "🧠", msg: "A perfect score. You could draw this architecture from memory." };
  if (pct >= 0.85) return { title: "Transformer Expert", emoji: "🏆", msg: "Outstanding. Your attention was clearly multi-headed." };
  if (pct >= 0.7) return { title: "Attention Master", emoji: "⚡", msg: "Great work. You attended to all the right tokens." };
  if (pct >= 0.5) return { title: "Rising Token", emoji: "🚀", msg: "Solid progress. A few more layers and you'll be an expert." };
  return { title: "Curious Learner", emoji: "🌱", msg: "Every expert starts with the first token. Thanks for learning with us!" };
}

function Trophy() {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="h-28 w-28 sm:h-36 sm:w-36"
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 10, delay: 0.2 }}
    >
      <defs>
        <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <motion.circle cx={60} cy={50} r={48} fill="#f59e0b" opacity={0.15} animate={{ r: [42, 54, 42] }} transition={{ repeat: Infinity, duration: 2.4 }} />
      <path d="M30 18 h60 v18 a30 30 0 0 1 -60 0 z" fill="url(#gold)" />
      <path d="M30 24 h-12 a12 12 0 0 0 12 22" fill="none" stroke="url(#gold)" strokeWidth={6} />
      <path d="M90 24 h12 a12 12 0 0 1 -12 22" fill="none" stroke="url(#gold)" strokeWidth={6} />
      <rect x={53} y={64} width={14} height={20} fill="url(#gold)" />
      <rect x={38} y={84} width={44} height={10} rx={3} fill="url(#gold)" />
      <rect x={32} y={94} width={56} height={12} rx={3} fill="#92400e" />
      <motion.path
        d="M60 26 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1 z"
        fill="#fff7ed"
        animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.1, 0.95] }}
        style={{ transformOrigin: "60px 38px" }}
        transition={{ repeat: Infinity, duration: 1.6 }}
      />
    </motion.svg>
  );
}

export function Celebration({ me, leaderboard, total }: { me: Me | null; leaderboard: LeaderboardEntry[]; total: number }) {
  const score = me?.score ?? 0;
  const pct = total ? score / total : 0;
  const b = badgeFor(pct);
  const rank = me ? leaderboard.find((e) => e.id === me.id)?.rank : undefined;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <Confetti />
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel flex flex-col items-center gap-3 p-6 text-center sm:p-8"
        >
          <Trophy />
          {me ? (
            <>
              <motion.h1
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-extrabold sm:text-4xl"
              >
                🎉 Congratulations, <span className="gradient-text">{me.username}</span>!
              </motion.h1>
              <p className="text-slate-300">You have completed the Transformer Architecture presentation!</p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="my-2 flex flex-col items-center"
              >
                <div className="text-sm uppercase tracking-widest text-slate-400">Your score</div>
                <div className="font-mono text-6xl font-extrabold text-white">
                  {score}
                  <span className="text-3xl text-slate-500"> / {total}</span>
                </div>
                <div className="mt-1 font-mono text-lg text-cyan-300">{Math.round(pct * 100)}%</div>
                {rank && <div className="mt-1 text-sm text-slate-400">Rank #{rank} of {leaderboard.length}</div>}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3, type: "spring" }}
                className="rounded-2xl border border-amber-300/40 bg-amber-300/10 px-5 py-3"
              >
                <div className="text-2xl font-bold text-amber-200">
                  {b.emoji} {b.title}
                </div>
                <div className="text-sm text-amber-100/80">{b.msg}</div>
              </motion.div>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-extrabold sm:text-5xl">
                <span className="gradient-text">That's a wrap!</span>
              </h1>
              <p className="text-slate-300">Thanks for exploring the inside of the Transformer.</p>
            </>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Leaderboard entries={leaderboard} total={total} highlightId={me?.id} limit={15} />
        </motion.div>
      </div>
    </div>
  );
}
