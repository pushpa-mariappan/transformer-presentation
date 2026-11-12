import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Segmented, VectorCells } from "../components/viz";
import { seededVector, softmax } from "../lib/sentence";

// Illustrative logits for a handful of vocabulary entries at each generation step.
const STEP_LOGITS: { token: string; logit: number }[][] = [
  [
    { token: " loan", logit: 6.2 },
    { token: " mortgage", logit: 5.4 },
    { token: " application", logit: 5.1 },
    { token: " request", logit: 4.6 },
    { token: " merger", logit: 4.0 },
    { token: " river", logit: 0.5 },
  ],
  [
    { token: ".", logit: 5.8 },
    { token: " for", logit: 5.0 },
    { token: " application", logit: 4.2 },
    { token: " after", logit: 4.0 },
    { token: ",", logit: 3.4 },
    { token: " banana", logit: -1.0 },
  ],
  [
    { token: "<end>", logit: 5.0 },
    { token: " The", logit: 4.6 },
    { token: " It", logit: 4.2 },
    { token: "\\n", logit: 4.0 },
    { token: " A", logit: 3.1 },
    { token: " loan", logit: 1.0 },
  ],
];
const PROMPT = ["The", " bank", " approved", " the"];

export default function Slide11Output() {
  const [generated, setGenerated] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(1);
  const [strategy, setStrategy] = useState<"greedy" | "sample">("greedy");
  const [picked, setPicked] = useState<number | null>(null);

  const stepIdx = Math.min(generated.length, STEP_LOGITS.length - 1);
  const done = generated[generated.length - 1] === "<end>";
  const cands = STEP_LOGITS[stepIdx];
  const probs = useMemo(() => softmax(cands.map((c) => c.logit), temperature), [cands, temperature]);
  const minLogit = Math.min(...cands.map((c) => c.logit));
  const maxLogit = Math.max(...cands.map((c) => c.logit));

  const generate = () => {
    if (done) return;
    let idx = 0;
    if (strategy === "greedy") {
      idx = probs.indexOf(Math.max(...probs));
    } else {
      let r = Math.random();
      idx = probs.findIndex((p) => (r -= p) <= 0);
      if (idx < 0) idx = probs.length - 1;
    }
    setPicked(idx);
    setTimeout(() => {
      setGenerated((g) => [...g, cands[idx].token]);
      setPicked(null);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* running text */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-ink-950/60 p-3 font-mono text-lg sm:text-2xl">
        {PROMPT.map((t, i) => (
          <span key={i} className="whitespace-pre rounded-md bg-white/5 px-1.5 text-slate-200">
            {t}
          </span>
        ))}
        <AnimatePresence>
          {generated.map((t, i) => (
            <motion.span
              key={`${i}-${t}`}
              initial={{ opacity: 0, y: -24, scale: 1.4 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="whitespace-pre rounded-md bg-pink-400/20 px-1.5 text-pink-200 ring-1 ring-pink-400/60"
            >
              {t}
            </motion.span>
          ))}
        </AnimatePresence>
        {!done && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="text-cyan-300">▍</motion.span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        {/* hidden state → projection */}
        <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono text-xs">
          <span className="text-slate-400">final hidden vector h</span>
          <span className="text-[10px] text-slate-500">(last position only)</span>
          <VectorCells key={generated.length} values={seededVector(900 + generated.length * 17, 8)} vertical cell={18} />
          <span className="text-slate-400">× W_out (d × |V|)</span>
          <motion.span animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} className="text-xl text-cyan-300">
            ↓
          </motion.span>
          <span className="text-cyan-300">one logit per vocab token</span>
          <span className="text-[10px] text-slate-500">|V| ≈ 50k – 200k</span>
        </div>

        {/* logits and probabilities */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 grid grid-cols-[6.5rem_1fr_1fr] gap-2 text-[11px] uppercase tracking-wider text-slate-500 sm:grid-cols-[8rem_1fr_1fr]">
            <span>token</span>
            <span>logit</span>
            <span>softmax probability</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {cands.map((c, i) => {
              const isPicked = picked === i;
              return (
                <motion.div
                  key={`${stepIdx}-${c.token}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0, scale: isPicked ? 1.03 : 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`grid grid-cols-[6.5rem_1fr_1fr] items-center gap-2 rounded-md px-1 py-0.5 sm:grid-cols-[8rem_1fr_1fr] ${isPicked ? "bg-pink-400/20 ring-1 ring-pink-400" : ""}`}
                >
                  <span className="truncate whitespace-pre font-mono text-sm text-slate-200">{c.token}</span>
                  <div className="flex items-center gap-1">
                    <motion.div
                      className="h-3 rounded bg-slate-400/60"
                      animate={{ width: `${((c.logit - minLogit + 0.5) / (maxLogit - minLogit + 0.5)) * 100}%` }}
                    />
                    <span className="font-mono text-[11px] text-slate-400">{c.logit.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.div
                      className="h-3 rounded bg-gradient-to-r from-cyan-400 to-purple-400"
                      animate={{ width: `${Math.max(probs[i] * 100, 0.5)}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    />
                    <span className="font-mono text-[11px] text-slate-300">{(probs[i] * 100).toFixed(1)}%</span>
                  </div>
                </motion.div>
              );
            })}
            <div className="pl-1 font-mono text-[11px] text-slate-600">… and every other token in the vocabulary</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <Segmented
          value={strategy}
          onChange={setStrategy}
          options={[
            { value: "greedy", label: "Greedy (argmax)" },
            { value: "sample", label: "Sample" },
          ]}
        />
        <label className="flex flex-1 items-center gap-2 text-xs text-slate-400">
          temperature
          <input
            type="range"
            min={0.2}
            max={2}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="min-w-[100px] flex-1 accent-purple-400"
          />
          <span className="w-8 font-mono text-slate-200">{temperature.toFixed(1)}</span>
        </label>
        <button className="btn-primary" onClick={generate} disabled={done || picked !== null}>
          {done ? "Stopped at <end>" : "Generate next token ▶"}
        </button>
        <button className="btn-ghost" onClick={() => setGenerated([])}>
          ↺ Reset
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Autoregressive loop: predict → choose → append → run again. Low temperature sharpens the distribution and high
        temperature flattens it. Logits are illustrative.
      </p>
    </div>
  );
}
