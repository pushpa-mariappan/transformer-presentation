import { motion } from "framer-motion";
import { FlowDot } from "../components/viz";
import { TOKENS } from "../lib/sentence";

const PROMPT = TOKENS.slice(0, 4); // "The bank approved the"
const XS = [110, 240, 370, 500];

function Box({ y, h, label, sub, color, delay }: { y: number; h: number; label: string; sub?: string; color: string; delay: number }) {
  return (
    <motion.g initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}>
      <rect x={50} y={y} width={510} height={h} rx={14} fill={`${color}18`} stroke={`${color}aa`} strokeWidth={1.5} />
      <text x={305} y={y + h / 2 + (sub ? -4 : 5)} textAnchor="middle" fill="#e2e8f0" fontSize={15} fontWeight={700}>
        {label}
      </text>
      {sub && (
        <text x={305} y={y + h / 2 + 14} textAnchor="middle" fill="#94a3b8" fontSize={11}>
          {sub}
        </text>
      )}
    </motion.g>
  );
}

export default function Slide01Intro() {
  return (
    <div className="flex flex-col gap-5">
      <svg viewBox="0 0 610 470" className="w-full max-h-[52vh]">
        <defs>
          <linearGradient id="s1-block" x1="0" x2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.12} />
          </linearGradient>
        </defs>

        {/* vertical data lanes, one per token */}
        {XS.map((x) => (
          <line key={x} x1={x} x2={x} y1={70} y2={420} stroke="#334155" strokeDasharray="3 5" />
        ))}

        <Box y={350} h={44} label="Token embeddings + position" color="#3b82f6" delay={0.2} />

        {/* Transformer block (repeated N times) */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <rect x={30} y={130} width={550} height={200} rx={18} fill="url(#s1-block)" stroke="#6366f1" strokeDasharray="6 4" />
          <text x={572} y={150} textAnchor="end" fill="#a5b4fc" fontSize={12} fontFamily="JetBrains Mono">
            × N blocks
          </text>
        </motion.g>
        <Box y={250} h={60} label="Self-Attention" sub="tokens exchange information" color="#22d3ee" delay={0.7} />
        <Box y={160} h={60} label="Feed-Forward Network" sub="each token transformed independently" color="#a855f7" delay={0.9} />

        {/* attention arcs: later tokens look back at earlier ones */}
        {[
          [1, 0],
          [2, 1],
          [3, 1],
          [3, 2],
        ].map(([from, to], i) => (
          <motion.path
            key={i}
            d={`M ${XS[from]} 262 Q ${(XS[from] + XS[to]) / 2} ${236 - (from - to) * 14} ${XS[to]} 262`}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 1, 0.35] }}
            transition={{ delay: 1.3 + i * 0.25, duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
          />
        ))}

        <Box y={56} h={52} label="Output → next-token probabilities" color="#f472b6" delay={1.1} />

        {/* input tokens */}
        {PROMPT.map((t, i) => (
          <motion.g key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <rect x={XS[i] - 52} y={416} width={104} height={36} rx={10} fill={`${t.color}22`} stroke={t.color} />
            <text x={XS[i]} y={439} textAnchor="middle" fill={t.color} fontSize={15} fontFamily="JetBrains Mono" fontWeight={600}>
              {t.text}
            </text>
          </motion.g>
        ))}

        {/* predicted token */}
        <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.2, type: "spring" }}>
          <rect x={448} y={6} width={104} height={36} rx={10} fill="#f472b633" stroke="#f472b6" />
          <text x={500} y={29} textAnchor="middle" fill="#f9a8d4" fontSize={15} fontFamily="JetBrains Mono" fontWeight={700}>
            loan ✨
          </text>
        </motion.g>

        {/* data flowing upward through every component */}
        {XS.map((x, i) => (
          <FlowDot key={x} path={`M ${x} 416 L ${x} 108`} delay={i * 0.35} duration={3.2} color={PROMPT[i].color} r={4.5} />
        ))}
      </svg>

      <ParallelVsSequential />
    </div>
  );
}

function ParallelVsSequential() {
  const words = TOKENS.map((t) => t.text);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Before: RNN · one token at a time</div>
        <div className="flex flex-wrap gap-1.5">
          {words.map((w, i) => (
            <motion.span
              key={i}
              className="chip border-slate-600 text-slate-300"
              animate={{ backgroundColor: ["rgba(255,255,255,0.02)", "rgba(148,163,184,0.45)", "rgba(255,255,255,0.02)"] }}
              transition={{ duration: 0.7, delay: i * 0.7, repeat: Infinity, repeatDelay: words.length * 0.7 - 0.7 }}
            >
              {w}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.05] p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">Transformer · all tokens in parallel</div>
        <div className="flex flex-wrap gap-1.5">
          {TOKENS.map((t, i) => (
            <motion.span
              key={i}
              className="chip"
              style={{ borderColor: t.color, color: t.color }}
              animate={{ backgroundColor: [`${t.color}08`, `${t.color}66`, `${t.color}08`] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6 }}
            >
              {t.text}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
