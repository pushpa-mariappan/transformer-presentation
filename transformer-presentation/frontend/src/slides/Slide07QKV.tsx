import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import { Matrix } from "../components/viz";
import { TOKENS, fmt, softmax } from "../lib/sentence";

// A 4-token excerpt, "bank approved the loan", with d_model = 4 and d_k = 2 so the numbers fit on screen.
const NAMES = ["bank", "approved", "the", "loan"];
const COLORS = [TOKENS[1].color, TOKENS[2].color, TOKENS[3].color, TOKENS[4].color];
const X = [
  [1.0, 0.2, 0.8, 0.0],
  [0.1, 1.0, 0.3, 0.4],
  [0.0, 0.1, 0.0, 1.0],
  [0.9, 0.3, 0.1, 0.2],
];
const WQ = [
  [1.0, 0.0],
  [0.0, 1.0],
  [0.5, 0.0],
  [0.0, 0.2],
];
const WK = [
  [0.2, 0.1],
  [0.0, 1.0],
  [1.5, 0.0],
  [0.0, 0.3],
];
const WV = [
  [1.0, 0.0],
  [0.0, 1.0],
  [0.5, 0.5],
  [0.0, 0.2],
];
const DK = 2;

const matmul = (A: number[][], B: number[][]) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const transpose = (A: number[][]) => A[0].map((_, j) => A.map((r) => r[j]));

const STEPS = [
  { id: "x", label: "Inputs X", formula: "X" },
  { id: "proj", label: "Q, K, V", formula: "Q = XW_Q · K = XW_K · V = XW_V" },
  { id: "scores", label: "QKᵀ", formula: "QKᵀ" },
  { id: "scale", label: "÷ √dₖ", formula: "QKᵀ / √dₖ" },
  { id: "mask", label: "Mask", formula: "mask future → −∞" },
  { id: "softmax", label: "Softmax", formula: "softmax(·) row-wise" },
  { id: "out", label: "× V", formula: "softmax(QKᵀ/√dₖ) V" },
] as const;

export default function Slide07QKV() {
  const [step, setStep] = useState(0);
  const m = useMemo(() => {
    const Q = matmul(X, WQ);
    const K = matmul(X, WK);
    const V = matmul(X, WV);
    const S = matmul(Q, transpose(K));
    const scaled = S.map((r) => r.map((v) => v / Math.sqrt(DK)));
    const masked = scaled.map((r, i) => r.map((v, j) => (j <= i ? v : -Infinity)));
    const A = masked.map((r) => softmax(r));
    const O = matmul(A, V);
    return { Q, K, V, S, scaled, masked, A, O };
  }, []);
  const LOAN = 3;

  return (
    <div className="flex flex-col gap-4">
      {/* formula with highlighted part */}
      <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-ink-950/60 px-3 py-4">
        <div className="font-mono text-xl sm:text-3xl">
          <span className={step === 6 ? "text-cyan-300" : "text-slate-300"}>Attention(Q, K, V) = </span>
          <span className={step === 5 ? "text-cyan-300" : "text-slate-300"}>softmax(</span>
          <span className={step === 2 || step === 1 ? "text-cyan-300" : "text-slate-300"}>QKᵀ</span>
          <span className={step === 3 ? "text-cyan-300" : "text-slate-300"}> / √dₖ</span>
          <span className={step === 5 ? "text-cyan-300" : "text-slate-300"}>)</span>
          <span className={step === 6 ? "text-cyan-300" : "text-slate-300"}>V</span>
        </div>
        <div className="font-mono text-xs text-slate-500">{STEPS[step].formula}</div>
      </div>

      {/* step buttons */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition sm:text-sm ${
              step === i
                ? "border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-glow"
                : i < step
                  ? "border-cyan-400/30 bg-cyan-400/5 text-cyan-300/80"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
            }`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
          Next step →
        </button>
      </div>

      <div className="min-h-[300px] overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-4"
          >
            {step === 0 && (
              <>
                <Matrix title="X: one row per token (d_model = 4)" data={X} rowLabels={NAMES} colLabels={["x₁", "x₂", "x₃", "x₄"]} />
                <Explain>Each row is a token's current representation: its embedding plus position, or the output of the previous block.</Explain>
              </>
            )}
            {step === 1 && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card name="Query" color="#22d3ee" q="“What am I looking for?”" />
                  <Card name="Key" color="#a78bfa" q="“What do I contain?”" />
                  <Card name="Value" color="#f472b6" q="“What do I pass along?”" />
                </div>
                <div className="flex flex-wrap items-start justify-center gap-4">
                  <Matrix title="Q = X·W_Q" data={m.Q} rowLabels={NAMES} colLabels={["q₁", "q₂"]} />
                  <Matrix title="K = X·W_K" data={m.K} rowLabels={NAMES} colLabels={["k₁", "k₂"]} />
                  <Matrix title="V = X·W_V" data={m.V} rowLabels={NAMES} colLabels={["v₁", "v₂"]} />
                </div>
                <Explain>W_Q, W_K and W_V are learned 4×2 weight matrices. The same weights are used for every token.</Explain>
              </>
            )}
            {step === 2 && (
              <>
                <Matrix title="scores = Q·Kᵀ (row = query, col = key)" data={m.S} rowLabels={NAMES} colLabels={NAMES} highlightRow={LOAN} />
                <Explain>
                  score(loan → bank) = q_loan · k_bank = {fmt(m.Q[LOAN][0])}×{fmt(m.K[0][0])} + {fmt(m.Q[LOAN][1])}×{fmt(m.K[0][1])} ={" "}
                  <b className="text-cyan-300">{fmt(m.S[LOAN][0])}</b>. A higher dot product means a better match.
                </Explain>
              </>
            )}
            {step === 3 && (
              <>
                <Matrix title={`scores / √${DK} (≈ ${fmt(Math.sqrt(DK))})`} data={m.scaled} rowLabels={NAMES} colLabels={NAMES} highlightRow={LOAN} />
                <Explain>Dividing by √dₖ keeps scores in a reasonable range as vectors get longer, so softmax doesn't saturate.</Explain>
              </>
            )}
            {step === 4 && (
              <>
                <Matrix title="causal mask applied" data={m.masked} rowLabels={NAMES} colLabels={NAMES} masked={(r, c) => c > r} highlightRow={LOAN} />
                <Explain>A token can't attend to positions after it, so those scores become −∞.</Explain>
              </>
            )}
            {step === 5 && (
              <>
                <Matrix title="attention weights = softmax per row" data={m.A} rowLabels={NAMES} colLabels={NAMES} heat masked={(r, c) => c > r} highlightRow={LOAN} />
                <WeightBar weights={m.A[LOAN]} />
                <Explain>Each row now sums to 1. “loan” puts most of its attention on “bank”.</Explain>
              </>
            )}
            {step === 6 && (
              <>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Matrix title="weights" data={m.A} rowLabels={NAMES} heat small masked={(r, c) => c > r} highlightRow={LOAN} />
                  <span className="text-2xl text-slate-500">×</span>
                  <Matrix title="V" data={m.V} small />
                  <span className="text-2xl text-slate-500">=</span>
                  <Matrix title="output (context-aware)" data={m.O} rowLabels={NAMES} highlightRow={LOAN} />
                </div>
                <Explain>
                  out_loan = {m.A[LOAN].map((w, i) => `${fmt(w)}·v_${NAMES[i]}`).join(" + ")} ={" "}
                  <b className="text-cyan-300">[{m.O[LOAN].map((v) => fmt(v)).join(", ")}]</b>. “loan” now carries information
                  from “bank” and “approved”.
                </Explain>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Explain({ children }: { children: ReactNode }) {
  return <p className="max-w-2xl text-center font-mono text-xs leading-relaxed text-slate-300 sm:text-sm">{children}</p>;
}

function Card({ name, color, q }: { name: string; color: string; q: string }) {
  return (
    <div className="rounded-lg border px-3 py-2 text-center" style={{ borderColor: `${color}66`, background: `${color}12` }}>
      <div className="font-bold" style={{ color }}>
        {name}
      </div>
      <div className="text-xs text-slate-300">{q}</div>
    </div>
  );
}

function WeightBar({ weights }: { weights: number[] }) {
  return (
    <div className="flex h-8 w-full max-w-xl overflow-hidden rounded-lg">
      {weights.map((w, i) => (
        <motion.div
          key={i}
          initial={{ width: 0 }}
          animate={{ width: `${w * 100}%` }}
          transition={{ delay: i * 0.1, duration: 0.6 }}
          className="flex items-center justify-center overflow-hidden whitespace-nowrap font-mono text-[11px] font-semibold text-ink-950"
          style={{ background: COLORS[i] }}
        >
          {w > 0.08 ? `${NAMES[i]} ${Math.round(w * 100)}%` : ""}
        </motion.div>
      ))}
    </div>
  );
}
