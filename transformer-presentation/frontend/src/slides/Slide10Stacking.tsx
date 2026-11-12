import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { valueColor } from "../components/viz";
import { TOKENS, seededVector } from "../lib/sentence";

const LAYERS = 6; // shown; real LLMs have 12 – 120+
const DIM = 6;

// Illustrative "financial bank" signal at the position of "loan", by layer
const SENSE_BY_LAYER = [0.5, 0.55, 0.66, 0.78, 0.88, 0.93, 0.96];

const PHASES = [
  { range: [0, 0], title: "Embeddings", text: "Context-free vectors: “bank” means the same thing everywhere." },
  { range: [1, 2], title: "Early layers", text: "Tend to capture local patterns: neighbouring tokens, word pieces, simple syntax." },
  { range: [3, 4], title: "Middle layers", text: "Build relations: who did what to whom. “loan” is tied to “bank” and “approved”." },
  { range: [5, 6], title: "Late layers", text: "Context-dependent meaning, shaped towards predicting the next token." },
];

export default function Slide10Stacking() {
  const [depth, setDepth] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    setDepth(0);
    let d = 0;
    const t = setInterval(() => {
      d += 1;
      if (d > LAYERS) return clearInterval(t);
      setDepth(d);
    }, 1100);
    return () => clearInterval(t);
  }, [run]);

  // Each layer blends a token's own vector with context from earlier tokens (causal) – illustrative.
  const grid = useMemo(() => {
    const base = TOKENS.map((t) => seededVector(t.id, DIM));
    return Array.from({ length: LAYERS + 1 }, (_, L) =>
      base.map((v, i) => {
        const ctx = Array.from({ length: DIM }, (_, d) => base.slice(0, i + 1).reduce((s, u) => s + u[d], 0) / (i + 1));
        const a = L / LAYERS;
        const noise = seededVector(L * 97 + i * 13 + 5, DIM);
        return v.map((x, d) => Math.max(-1, Math.min(1, (1 - a) * x + a * ctx[d] * 1.6 + noise[d] * 0.15 * (L > 0 ? 1 : 0))));
      }),
    );
  }, []);

  const phase = PHASES.find((p) => depth >= p.range[0] && depth <= p.range[1]) ?? PHASES[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="rounded-xl border border-white/10 bg-ink-950/60 p-3">
        <div className="flex flex-col-reverse gap-1.5">
          {grid.map((row, L) => {
            const reached = L <= depth;
            const isCur = L === depth;
            return (
              <motion.div
                key={L}
                onClick={() => setDepth(L)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg p-1.5 transition ${isCur ? "bg-cyan-400/10 ring-1 ring-cyan-300/60" : ""}`}
                animate={{ opacity: reached ? 1 : 0.25 }}
              >
                <span className={`w-16 shrink-0 font-mono text-[10px] sm:text-xs ${isCur ? "text-cyan-300" : "text-slate-500"}`}>
                  {L === 0 ? "embed" : `block ${L}`}
                </span>
                <div className="grid flex-1 grid-cols-6 gap-1.5">
                  {row.map((vec, i) => (
                    <div key={i} className="flex justify-center gap-[2px]">
                      {vec.map((v, d) => (
                        <motion.div
                          key={d}
                          className="h-4 flex-1 rounded-[2px] sm:h-5"
                          animate={{ backgroundColor: reached ? valueColor(v) : "rgba(255,255,255,0.04)" }}
                          transition={{ duration: 0.5, delay: reached && isCur ? i * 0.05 : 0 }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
          <div className="flex items-center gap-2 px-1.5 pt-1">
            <span className="w-16 shrink-0" />
            <div className="grid flex-1 grid-cols-6 gap-1.5">
              {TOKENS.map((t) => (
                <div key={t.id} className="text-center font-mono text-[10px] font-semibold sm:text-xs" style={{ color: t.color }}>
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-[11px] text-slate-500">
          ↑ data flows upward · each block reads the vectors below and adds a refinement (residual stream) · 6 blocks shown,
          real LLMs use roughly 12 – 120+
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-ghost !py-1.5 text-xs" onClick={() => setRun((r) => r + 1)}>
            ↻ Replay pass
          </button>
          <input
            type="range"
            min={0}
            max={LAYERS}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="flex-1 accent-cyan-400"
            aria-label="Layer depth"
          />
        </div>
        <motion.div key={phase.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] p-4">
          <div className="text-lg font-bold text-cyan-200">{phase.title}</div>
          <p className="text-sm text-slate-300">{phase.text}</p>
        </motion.div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="kicker mb-2">At the “loan” position, “bank” reads as…</div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-sky-300">🌊 river</span>
            <span className="text-pink-300">🏦 financial</span>
          </div>
          <div className="relative h-4 overflow-hidden rounded-full bg-sky-400/20">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400"
              animate={{ width: `${SENSE_BY_LAYER[depth] * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Illustrative. Probing studies show contextual meaning becomes easier to read out in deeper layers.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-slate-300">
          h₀ = embed + pos
          <br />
          h₁ = Block₁(h₀)
          <br />h₂ = Block₂(h₁) … h_N = Block_N(h_N₋₁)
        </div>
      </div>
    </div>
  );
}
