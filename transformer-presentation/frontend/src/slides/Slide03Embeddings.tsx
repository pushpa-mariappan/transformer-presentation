import { motion } from "framer-motion";
import { useState } from "react";
import { TokenChip, VectorCells, valueColor } from "../components/viz";
import { EMBED_DIM, EMBEDDINGS, TOKENS, fmt } from "../lib/sentence";

// Vocabulary rows shown in the embedding table (sorted by ID like a real lookup table)
const VOCAB_ROWS = [...TOKENS.map((t, i) => ({ id: t.id, label: t.raw.replace(/ /g, "␣"), tokenIndex: i }))].sort(
  (a, b) => a.id - b.id,
);

// Illustrative 2-D projection of an embedding space
const SPACE: { w: string; x: number; y: number; group: "fin" | "river" | "verb" | "fn" | "bank" }[] = [
  { w: "loan", x: 78, y: 24, group: "fin" },
  { w: "credit", x: 86, y: 34, group: "fin" },
  { w: "deposit", x: 70, y: 16, group: "fin" },
  { w: "money", x: 88, y: 18, group: "fin" },
  { w: "river", x: 18, y: 26, group: "river" },
  { w: "shore", x: 10, y: 38, group: "river" },
  { w: "water", x: 24, y: 14, group: "river" },
  { w: "approved", x: 62, y: 78, group: "verb" },
  { w: "rejected", x: 74, y: 86, group: "verb" },
  { w: "granted", x: 54, y: 88, group: "verb" },
  { w: "the", x: 18, y: 80, group: "fn" },
  { w: "a", x: 26, y: 90, group: "fn" },
  { w: "bank", x: 50, y: 26, group: "bank" },
];
const GROUP_COLOR = { fin: "#f472b6", river: "#38bdf8", verb: "#a78bfa", fn: "#94a3b8", bank: "#22d3ee" };

export default function Slide03Embeddings() {
  const [sel, setSel] = useState(1);
  const token = TOKENS[sel];
  const vec = EMBEDDINGS[sel];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-center gap-2">
        {TOKENS.map((t, i) => (
          <TokenChip key={t.id} text={t.text} color={t.color} sub={t.id} active={i === sel} onClick={() => setSel(i)} />
        ))}
      </div>

      <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        {/* Embedding matrix */}
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-xs text-cyan-300">Embedding matrix E</span>
            <span className="font-mono text-[10px] text-slate-500">
              |V| rows × d = {EMBED_DIM} cols
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-mono text-[10px] text-slate-600">⋮</div>
            {VOCAB_ROWS.map((r) => {
              const active = r.tokenIndex === sel;
              return (
                <motion.div
                  key={r.id}
                  onClick={() => setSel(r.tokenIndex)}
                  animate={{ backgroundColor: active ? "rgba(34,211,238,0.12)" : "rgba(0,0,0,0)" }}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 ${active ? "ring-1 ring-cyan-300/60" : ""}`}
                >
                  <span className="w-10 text-right font-mono text-[11px] text-slate-400">{r.id}</span>
                  <span className="w-20 truncate font-mono text-[11px] text-slate-500">{r.label}</span>
                  <div className="flex gap-[2px]">
                    {EMBEDDINGS[r.tokenIndex].map((v, i) => (
                      <div key={i} className="h-3.5 w-3.5 rounded-[3px]" style={{ background: valueColor(v) }} />
                    ))}
                  </div>
                </motion.div>
              );
            })}
            <div className="font-mono text-[10px] text-slate-600">⋮</div>
          </div>
        </div>

        <motion.div
          key={`arrow-${sel}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center gap-1 font-mono text-xs text-slate-400"
        >
          <span>lookup row {token.id}</span>
          <span className="rotate-90 text-2xl text-cyan-300 lg:rotate-0">⟶</span>
        </motion.div>

        {/* Output vector */}
        <div className="flex flex-col items-center gap-3 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.04] p-4">
          <div className="font-mono text-sm" style={{ color: token.color }}>
            embedding(“{token.text}”)
          </div>
          <VectorCells key={sel} values={vec} cell={26} showValues />
          <div className="font-mono text-[11px] text-slate-500">
            [{vec.slice(0, 3).map((v) => fmt(v)).join(", ")}, … ] · d = {EMBED_DIM} here; real models use 768 – 12,288+
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="kicker mb-1">Embedding space (2-D sketch)</div>
          <svg viewBox="0 0 100 100" className="h-56 w-full">
            {SPACE.map((p, i) => (
              <motion.g key={p.w} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}>
                <circle cx={p.x} cy={p.y} r={p.group === "bank" ? 2.6 : 1.6} fill={GROUP_COLOR[p.group]} />
                <text x={p.x + 3} y={p.y + 1.5} fontSize={p.group === "bank" ? 5 : 4} fill={GROUP_COLOR[p.group]} fontWeight={p.group === "bank" ? 700 : 400}>
                  {p.w}
                </text>
              </motion.g>
            ))}
            <motion.circle
              cx={50}
              cy={26}
              r={8}
              fill="none"
              stroke="#22d3ee"
              strokeDasharray="2 2"
              animate={{ r: [6, 10, 6], opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
          </svg>
        </div>
        <div className="flex flex-col justify-center gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="font-semibold text-slate-100">Learned, not hand-written</div>
            <p className="text-slate-400">The vectors start random. Training nudges them so tokens used in similar ways end up close together.</p>
          </div>
          <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.05] p-3">
            <div className="font-semibold text-amber-100">But context is missing</div>
            <p className="text-slate-400">
              “bank” gets the <em>same</em> vector in “river bank” and “bank approved the loan”. It sits between the money
              words and the river words. Later layers have to work out which sense is meant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
