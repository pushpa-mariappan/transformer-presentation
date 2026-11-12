import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Matrix, Segmented } from "../components/viz";
import { TOKENS } from "../lib/sentence";

// Illustrative attention weights (each row sums to 1). Row = query token, column = key token.
const CAUSAL: number[][] = [
  [1, 0, 0, 0, 0, 0],
  [0.35, 0.65, 0, 0, 0, 0],
  [0.12, 0.58, 0.3, 0, 0, 0],
  [0.1, 0.2, 0.45, 0.25, 0, 0],
  [0.05, 0.42, 0.33, 0.06, 0.14, 0],
  [0.06, 0.2, 0.24, 0.05, 0.33, 0.12],
];
const BIDIRECTIONAL: number[][] = [
  [0.3, 0.25, 0.15, 0.08, 0.12, 0.1],
  [0.08, 0.26, 0.24, 0.04, 0.34, 0.04],
  [0.06, 0.36, 0.2, 0.04, 0.3, 0.04],
  [0.08, 0.06, 0.1, 0.3, 0.42, 0.04],
  [0.04, 0.38, 0.3, 0.08, 0.16, 0.04],
  [0.1, 0.16, 0.2, 0.06, 0.28, 0.2],
];
// Illustrative: how strongly the representation at each position reflects "financial bank"
const SENSE_CAUSAL = [null, 0.5, 0.72, 0.74, 0.95, 0.96];
const SENSE_BIDIR = [0.88, 0.93, 0.94, 0.9, 0.96, 0.95];

const XS = TOKENS.map((_, i) => 55 + i * 100);
const BASE_Y = 190;

export default function Slide06SelfAttention() {
  const [mode, setMode] = useState<"causal" | "bidir">("causal");
  const [q, setQ] = useState(4); // "loan"
  const W = mode === "causal" ? CAUSAL : BIDIRECTIONAL;
  const row = W[q];
  const sense = (mode === "causal" ? SENSE_CAUSAL : SENSE_BIDIR)[q];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "causal", label: "Decoder (causal mask)" },
            { value: "bidir", label: "Encoder (bidirectional)" },
          ]}
        />
        <span className="text-xs text-slate-400">Click a token to make it the one “looking”.</span>
      </div>

      <div className="rounded-xl border border-white/10 bg-ink-950/60 p-2">
        <svg viewBox="0 0 610 250" className="w-full">
          <AnimatePresence>
            {row.map((w, k) => {
              if (w <= 0 || k === q) return null;
              const x1 = XS[q],
                x2 = XS[k];
              const h = 30 + Math.abs(q - k) * 26;
              return (
                <motion.g key={`${mode}-${q}-${k}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.path
                    d={`M ${x1} ${BASE_Y - 22} Q ${(x1 + x2) / 2} ${BASE_Y - 22 - h * 1.6} ${x2} ${BASE_Y - 22}`}
                    fill="none"
                    stroke={TOKENS[k].color}
                    strokeWidth={1 + w * 16}
                    strokeOpacity={0.25 + w * 0.75}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, delay: 0.05 * Math.abs(q - k) }}
                  />
                  <text x={(x1 + x2) / 2} y={BASE_Y - 26 - h * 0.8} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontFamily="JetBrains Mono">
                    {Math.round(w * 100)}%
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>

          {TOKENS.map((t, i) => {
            const masked = mode === "causal" && i > q;
            const isQ = i === q;
            return (
              <g key={t.id} onClick={() => setQ(i)} className="cursor-pointer">
                <rect
                  x={XS[i] - 46}
                  y={BASE_Y - 20}
                  width={92}
                  height={40}
                  rx={10}
                  fill={isQ ? `${t.color}44` : `${t.color}14`}
                  stroke={t.color}
                  strokeWidth={isQ ? 2.5 : 1}
                  opacity={masked ? 0.25 : 1}
                />
                <text x={XS[i]} y={BASE_Y + 6} textAnchor="middle" fill={t.color} fontSize={16} fontWeight={700} fontFamily="JetBrains Mono" opacity={masked ? 0.3 : 1}>
                  {t.text}
                </text>
                {masked && (
                  <text x={XS[i]} y={BASE_Y + 40} textAnchor="middle" fill="#64748b" fontSize={11}>
                    🔒 future
                  </text>
                )}
                {isQ && (
                  <text x={XS[i]} y={BASE_Y + 40} textAnchor="middle" fill="#22d3ee" fontSize={11} fontWeight={700}>
                    ▲ query · self {Math.round(row[q] * 100)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Matrix
            key={mode}
            title="attention weights (rows sum to 1)"
            data={W}
            rowLabels={TOKENS.map((t) => t.text)}
            colLabels={TOKENS.map((t) => t.text)}
            heat
            small
            highlightRow={q}
            masked={mode === "causal" ? (r, c) => c > r : undefined}
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="kicker mb-2">
              How the vector at “{TOKENS[q].text}” reads <span className="text-cyan-300">bank</span>
            </div>
            {sense === null ? (
              <p className="text-sm text-slate-400">“The” comes before “bank”, so it can't see it yet in causal mode.</p>
            ) : (
              <>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-sky-300">🌊 riverbank</span>
                  <span className="text-pink-300">🏦 financial bank</span>
                </div>
                <div className="relative h-4 overflow-hidden rounded-full bg-sky-400/20">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400"
                    animate={{ width: `${sense * 100}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 16 }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {mode === "causal" && q === 1
                    ? "At “bank” itself the model has only seen “The bank”, so the sense is still ambiguous."
                    : mode === "causal"
                      ? "Later positions attend back to “bank” and combine it with “approved” and “loan”. This is where the financial sense shows up."
                      : "With bidirectional attention, “bank” can look ahead at “loan” directly (BERT-style encoders)."}
                </p>
              </>
            )}
          </div>
          <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.05] p-3 text-sm text-slate-300">
            <b className="text-cyan-200">Causal mask:</b> in a decoder-only LLM, each token sees only itself and{" "}
            <em>earlier</em> tokens. Future positions get a score of −∞, which becomes 0 after softmax. Without the mask the
            model could just copy the answer while learning to predict the next token.
          </div>
          <p className="text-[11px] text-slate-500">Weights shown are illustrative, chosen to show typical patterns.</p>
        </div>
      </div>
    </div>
  );
}
