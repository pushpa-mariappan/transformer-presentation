import { motion } from "framer-motion";
import { useState } from "react";
import { TokenChip, VectorCells } from "../components/viz";
import { TOKENS, seededVector } from "../lib/sentence";

const pad = (r: number[]) => [...r, ...Array(6 - r.length).fill(0)];

const HEADS: { name: string; desc: string; color: string; W: number[][] }[] = [
  {
    name: "Head 1 · previous token",
    desc: "Looks at the token just before. Useful for local phrase structure.",
    color: "#22d3ee",
    W: TOKENS.map((_, i) => pad(i === 0 ? [1] : [...Array(i - 1).fill(0), 0.8, 0.2])),
  },
  {
    name: "Head 2 · noun ↔ noun",
    desc: "“loan” links to “bank”: who is involved in the event.",
    color: "#f472b6",
    W: [[1], [0.3, 0.7], [0.2, 0.6, 0.2], [0.2, 0.5, 0.2, 0.1], [0.05, 0.8, 0.05, 0.05, 0.05], [0.05, 0.35, 0.05, 0.05, 0.45, 0.05]].map(pad),
  },
  {
    name: "Head 3 · action",
    desc: "Tokens look at the verb “approved”: what happened.",
    color: "#a78bfa",
    W: [[1], [0.5, 0.5], [0.2, 0.3, 0.5], [0.1, 0.1, 0.7, 0.1], [0.05, 0.15, 0.7, 0.05, 0.05], [0.05, 0.05, 0.6, 0.05, 0.2, 0.05]].map(pad),
  },
  {
    name: "Head 4 · first-token “sink”",
    desc: "Parks most attention on the first token when nothing else is relevant. Commonly seen in real LLMs.",
    color: "#fbbf24",
    W: TOKENS.map((_, i) => pad(i === 0 ? [1] : [0.7, ...Array(i).fill(0.3 / i)])),
  },
];

const XS = TOKENS.map((_, i) => 25 + i * 50);

function MiniHead({ head, q, index }: { head: (typeof HEADS)[number]; q: number; index: number }) {
  const row = head.W[q];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className="rounded-xl border p-2"
      style={{ borderColor: `${head.color}55`, background: `${head.color}0c` }}
    >
      <div className="px-1 text-xs font-bold" style={{ color: head.color }}>
        {head.name}
      </div>
      <svg viewBox="0 0 300 110" className="w-full">
        {row.map((w, k) => {
          if (w <= 0.001 || k === q) return null;
          const h = 14 + Math.abs(q - k) * 13;
          return (
            <motion.path
              key={`${q}-${k}`}
              d={`M ${XS[q]} 78 Q ${(XS[q] + XS[k]) / 2} ${78 - h * 1.8} ${XS[k]} 78`}
              fill="none"
              stroke={head.color}
              strokeWidth={0.5 + w * 9}
              strokeOpacity={0.3 + w * 0.7}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
            />
          );
        })}
        {TOKENS.map((t, i) => (
          <text
            key={t.id}
            x={XS[i]}
            y={96}
            textAnchor="middle"
            fontSize={12}
            fontFamily="JetBrains Mono"
            fontWeight={i === q ? 700 : 400}
            fill={i > q ? "#334155" : i === q ? head.color : "#cbd5e1"}
          >
            {t.text}
          </text>
        ))}
      </svg>
      <div className="px-1 text-[11px] leading-snug text-slate-400">{head.desc}</div>
    </motion.div>
  );
}

export default function Slide08MultiHead() {
  const [q, setQ] = useState(4);
  const headOutputs = HEADS.map((_, h) => seededVector(q * 31 + h * 7 + 3, 2));
  const combined = seededVector(q * 13 + 101, 8);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-slate-400">Query token:</span>
        {TOKENS.map((t, i) => (
          <TokenChip key={t.id} text={t.text} color={t.color} active={i === q} onClick={() => setQ(i)} />
        ))}
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2">
        {HEADS.map((h, i) => (
          <MiniHead key={h.name} head={h} q={q} index={i} />
        ))}
        <motion.div
          className="pointer-events-none absolute -inset-1 rounded-2xl border border-cyan-300/40"
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
      </div>

      {/* concat + output projection */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/10 bg-ink-950/60 p-4 font-mono text-xs">
        {HEADS.map((h, i) => (
          <motion.div
            key={`${q}-${i}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.12 }}
            className="flex flex-col items-center gap-1 rounded-lg p-1"
            style={{ outline: `1px solid ${h.color}66` }}
          >
            <VectorCells values={headOutputs[i]} cell={18} />
            <span style={{ color: h.color }}>head {i + 1}</span>
          </motion.div>
        ))}
        <span className="text-lg text-slate-500">→ concat →</span>
        <VectorCells key={`c-${q}`} values={headOutputs.flat()} cell={16} delay={1.2} />
        <span className="text-lg text-slate-500">× W_O →</span>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="flex flex-col items-center gap-1">
          <VectorCells key={`o-${q}`} values={combined} cell={16} delay={1.6} />
          <span className="text-cyan-300">output for “{TOKENS[q].text}”</span>
        </motion.div>
      </div>
      <p className="text-center text-xs text-slate-500">
        Toy sizes: 4 heads × 2 dims = 8. In the original Transformer, 8 heads × 64 dims = 512. Head “roles” are
        illustrative. Real heads learn their patterns in training and are only sometimes this easy to interpret.
      </p>
    </div>
  );
}
