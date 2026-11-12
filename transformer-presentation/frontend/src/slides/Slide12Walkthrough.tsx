import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TokenChip, VectorCells } from "../components/viz";
import { EMBEDDINGS, TOKENS, sinusoidalPE, softmax } from "../lib/sentence";

const PROMPT = TOKENS.slice(0, 4);
const STAGES = [
  "Input sentence",
  "Tokenization",
  "Token embeddings",
  "Positional information",
  "Transformer blocks",
  "Attention",
  "Feed-forward",
  "Output projection",
  "Next-token probabilities",
];
const CANDS = [
  { t: " loan", l: 6.2 },
  { t: " mortgage", l: 5.4 },
  { t: " application", l: 5.1 },
  { t: " request", l: 4.6 },
  { t: " merger", l: 4.0 },
  { t: " river", l: 0.5 },
];
const STAGE_MS = 2600;

export default function Slide12Walkthrough() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    if (stage >= STAGES.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStage((s) => s + 1), STAGE_MS);
    return () => clearTimeout(t);
  }, [stage, playing]);

  return (
    <div className="flex flex-col gap-4">
      {/* pipeline stepper */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-1">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => {
                  setStage(i);
                  setPlaying(false);
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
                  i === stage
                    ? "border-cyan-300 bg-cyan-400/25 text-cyan-50 shadow-glow"
                    : i < stage
                      ? "border-purple-400/40 bg-purple-400/10 text-purple-200"
                      : "border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {s}
              </button>
              {i < STAGES.length - 1 && (
                <motion.span animate={{ color: i < stage ? "#c084fc" : "#334155" }} className="text-sm">
                  →
                </motion.span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500"
          animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
        />
      </div>

      <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-ink-950/70 p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
            transition={{ duration: 0.45 }}
            className="flex w-full flex-col items-center gap-4"
          >
            <div className="kicker">
              Stage {stage + 1} · {STAGES[stage]}
            </div>
            <StageView stage={stage} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost !py-1.5 text-sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          className="btn-ghost !py-1.5 text-sm"
          onClick={() => {
            setStage(0);
            setPlaying(true);
          }}
        >
          ↻ Replay from start
        </button>
        <button className="btn-ghost !py-1.5 text-sm" onClick={() => setStage((s) => Math.max(0, s - 1))} disabled={stage === 0}>
          ← Back
        </button>
        <button className="btn-ghost !py-1.5 text-sm" onClick={() => setStage((s) => Math.min(STAGES.length - 1, s + 1))} disabled={stage === STAGES.length - 1}>
          Forward →
        </button>
      </div>
    </div>
  );
}

function StageView({ stage }: { stage: number }) {
  switch (stage) {
    case 0:
      return (
        <div className="text-center text-3xl font-bold sm:text-5xl">
          “The bank approved the <span className="text-slate-600">___</span>”
        </div>
      );
    case 1:
      return (
        <div className="flex flex-wrap justify-center gap-3">
          {PROMPT.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
              <TokenChip text={t.text} color={t.color} sub={`ID ${t.id}`} className="!text-xl" />
            </motion.div>
          ))}
        </div>
      );
    case 2:
      return (
        <div className="flex flex-col gap-2">
          {PROMPT.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3">
              <span className="w-24 text-right font-mono text-sm" style={{ color: t.color }}>
                {t.text} → {t.id}
              </span>
              <VectorCells values={EMBEDDINGS[i]} cell={22} delay={i * 0.15} />
            </div>
          ))}
        </div>
      );
    case 3:
      return (
        <div className="flex flex-col gap-2">
          {PROMPT.map((t, i) => (
            <div key={t.id} className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="w-16 text-right" style={{ color: t.color }}>
                {t.text}
              </span>
              <VectorCells values={EMBEDDINGS[i]} cell={14} />
              <span className="text-cyan-300">+ pos {i}</span>
              <VectorCells values={sinusoidalPE(i, 8)} cell={14} delay={0.3 + i * 0.1} />
              <span className="text-cyan-300">=</span>
              <VectorCells values={EMBEDDINGS[i].map((v, k) => Math.max(-1, Math.min(1, v + sinusoidalPE(i, 8)[k])))} cell={14} delay={0.8 + i * 0.1} />
            </div>
          ))}
        </div>
      );
    case 4:
      return (
        <div className="flex flex-col-reverse items-center gap-2">
          {Array.from({ length: 5 }, (_, b) => (
            <motion.div
              key={b}
              className="flex w-72 items-center justify-between rounded-xl border border-indigo-400/50 px-4 py-2 font-mono text-sm sm:w-96"
              animate={{ backgroundColor: ["rgba(99,102,241,0.06)", "rgba(99,102,241,0.35)", "rgba(99,102,241,0.06)"] }}
              transition={{ duration: 0.9, delay: b * 0.4, repeat: Infinity, repeatDelay: 1.1 }}
            >
              <span className="text-indigo-200">{b === 4 ? "Block N" : `Block ${b + 1}`}</span>
              <span className="text-[11px] text-slate-400">attention → FFN (+ residuals, LayerNorm)</span>
            </motion.div>
          ))}
        </div>
      );
    case 5: {
      const w = [0.1, 0.2, 0.45, 0.25]; // same as the "the" row on the self-attention slide
      const xs = [60, 180, 300, 420];
      return (
        <svg viewBox="0 0 480 180" className="w-full max-w-xl">
          {w.map((v, k) =>
            k === 3 ? null : (
              <motion.path
                key={k}
                d={`M 420 120 Q ${(420 + xs[k]) / 2} ${100 - (3 - k) * 30} ${xs[k]} 120`}
                fill="none"
                stroke={PROMPT[k].color}
                strokeWidth={1 + v * 18}
                strokeOpacity={0.4 + v}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.2 + k * 0.2, duration: 0.8 }}
              />
            ),
          )}
          {PROMPT.map((t, i) => (
            <g key={t.id}>
              <rect x={xs[i] - 45} y={122} width={90} height={34} rx={9} fill={`${t.color}22`} stroke={t.color} strokeWidth={i === 3 ? 2.5 : 1} />
              <text x={xs[i]} y={145} textAnchor="middle" fill={t.color} fontSize={15} fontFamily="JetBrains Mono" fontWeight={700}>
                {t.text}
              </text>
              <text x={xs[i]} y={174} textAnchor="middle" fill="#94a3b8" fontSize={11}>
                {Math.round(w[i] * 100)}%
              </text>
            </g>
          ))}
          <text x={240} y={18} textAnchor="middle" fill="#cbd5e1" fontSize={12}>
            the last position looks back (causal) at “bank” and “approved”
          </text>
        </svg>
      );
    }
    case 6:
      return (
        <div className="flex flex-wrap justify-center gap-4">
          {PROMPT.map((t, i) => (
            <motion.div key={t.id} className="flex flex-col items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}>
              <span className="font-mono text-sm" style={{ color: t.color }}>
                {t.text}
              </span>
              <motion.div className="h-3 rounded bg-cyan-400/70" style={{ width: 36 }} />
              <motion.div
                className="h-3 rounded bg-purple-400/80"
                initial={{ width: 36 }}
                animate={{ width: [36, 120, 120, 36] }}
                transition={{ duration: 2, delay: 0.3 + i * 0.1, repeat: Infinity }}
              />
              <span className="text-[10px] text-slate-500">expand · GELU · project</span>
              <motion.div className="h-3 rounded bg-pink-400/80" style={{ width: 36 }} />
            </motion.div>
          ))}
        </div>
      );
    case 7:
      return (
        <div className="flex w-full max-w-lg flex-col gap-1.5">
          <div className="mb-1 text-center font-mono text-xs text-slate-400">h_last × W_out → logits</div>
          {CANDS.map((c, i) => (
            <div key={c.t} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-2 font-mono text-sm">
              <span className="whitespace-pre text-slate-200">{c.t}</span>
              <motion.div className="h-4 rounded bg-slate-400/60" initial={{ width: 0 }} animate={{ width: `${(c.l / 6.2) * 100}%` }} transition={{ delay: i * 0.12 }} />
              <span className="text-slate-400">{c.l.toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    default: {
      const probs = softmax(CANDS.map((c) => c.l));
      return (
        <div className="flex w-full max-w-lg flex-col items-center gap-3">
          {CANDS.map((c, i) => (
            <div key={c.t} className="grid w-full grid-cols-[7rem_1fr_3.5rem] items-center gap-2 font-mono text-sm">
              <span className={`whitespace-pre ${i === 0 ? "font-bold text-pink-300" : "text-slate-300"}`}>{c.t}</span>
              <motion.div
                className={`h-4 rounded ${i === 0 ? "bg-gradient-to-r from-pink-400 to-purple-400" : "bg-cyan-400/50"}`}
                initial={{ width: 0 }}
                animate={{ width: `${probs[i] * 100}%` }}
                transition={{ delay: i * 0.12 }}
              />
              <span className="text-slate-300">{(probs[i] * 100).toFixed(0)}%</span>
            </div>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring" }}
            className="mt-2 text-center text-2xl font-bold sm:text-3xl"
          >
            The bank approved the <span className="rounded-lg bg-pink-400/20 px-2 text-pink-300 ring-1 ring-pink-400">loan</span>
            <div className="mt-1 text-xs font-normal text-slate-400">Append it and repeat: that's how the whole sentence gets generated.</div>
          </motion.div>
        </div>
      );
    }
  }
}
