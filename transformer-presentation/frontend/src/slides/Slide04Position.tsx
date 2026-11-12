import { motion } from "framer-motion";
import { useState } from "react";
import { Segmented, TokenChip, VectorCells, valueColor } from "../components/viz";
import { EMBED_DIM, EMBEDDINGS, TOKENS, seededVector, sinusoidalPE } from "../lib/sentence";

type Method = "sin" | "learned" | "rope";

const SWAPPED = [0, 4, 2, 3, 1, 5]; // "The loan approved the bank."

export default function Slide04Position() {
  const [withPos, setWithPos] = useState(false);
  const [sel, setSel] = useState(1);
  const [method, setMethod] = useState<Method>("sin");

  const emb = EMBEDDINGS[sel];
  const pe = sinusoidalPE(sel, EMBED_DIM);
  const sum = emb.map((v, i) => Math.round((v + pe[i]) * 100) / 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Order matters */}
      <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="kicker">Same tokens, different order</div>
          <Segmented
            value={withPos ? "pos" : "bag"}
            onChange={(v) => setWithPos(v === "pos")}
            options={[
              { value: "bag", label: "Attention without position" },
              { value: "pos", label: "With position" },
            ]}
          />
        </div>
        {[TOKENS.map((_, i) => i), SWAPPED].map((order, row) => (
          <div key={row} className="mb-2 flex flex-wrap items-center gap-1.5">
            {order.map((ti, pos) => {
              const t = TOKENS[ti];
              return (
                <TokenChip
                  key={`${row}-${t.id}`}
                  text={t.text}
                  color={t.color}
                  sub={withPos ? `pos ${pos}` : undefined}
                  active={withPos && (ti === 1 || ti === 4)}
                />
              );
            })}
            <span className="ml-2 text-xs text-slate-500">{row === 0 ? "the bank lends" : "the loan… approves the bank?"}</span>
          </div>
        ))}
        <motion.p key={String(withPos)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-1 text-sm ${withPos ? "text-emerald-300" : "text-amber-200"}`}>
          {withPos
            ? "With positions attached, “bank @1 … loan @4” and “loan @1 … bank @4” become different inputs."
            : "Attention compares tokens as an unordered set. Without positions, both sentences contain exactly the same tokens."}
        </motion.p>
      </div>

      {/* Adding positional information */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="kicker mb-3">Input = token embedding + position</div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {TOKENS.map((t, i) => (
              <TokenChip key={t.id} text={t.text} color={t.color} sub={`pos ${i}`} active={i === sel} onClick={() => setSel(i)} />
            ))}
          </div>
          <div className="flex flex-col gap-2 font-mono text-xs">
            <Row label={`embed(“${TOKENS[sel].text}”)`} values={emb} k={`e${sel}`} />
            <div className="pl-2 text-lg text-cyan-300">+</div>
            <Row label={`PE(pos=${sel})`} values={pe} k={`p${sel}`} delay={0.3} />
            <div className="pl-2 text-lg text-cyan-300">=</div>
            <Row label="input vector" values={sum} k={`s${sel}`} delay={0.6} highlight />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3">
            <Segmented
              value={method}
              onChange={setMethod}
              options={[
                { value: "sin", label: "Sinusoidal" },
                { value: "learned", label: "Learned" },
                { value: "rope", label: "Rotary (RoPE)" },
              ]}
            />
          </div>
          {method === "sin" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-300">
                Original Transformer (2017): fixed sine/cosine waves at different frequencies, <b>added</b> to embeddings.
              </p>
              <div className="flex flex-col gap-[3px]">
                {Array.from({ length: 12 }, (_, pos) => (
                  <div key={pos} className="flex items-center gap-[3px]">
                    <span className={`w-10 font-mono text-[10px] ${pos === sel ? "text-cyan-300" : "text-slate-500"}`}>pos {pos}</span>
                    {sinusoidalPE(pos, 16).map((v, i) => (
                      <div
                        key={i}
                        className={`h-3 flex-1 rounded-[2px] ${pos === sel ? "ring-1 ring-cyan-300" : ""}`}
                        style={{ background: valueColor(v) }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <p className="font-mono text-[10px] text-slate-500">PE(pos, 2i) = sin(pos / 10000^(2i/d)) · PE(pos, 2i+1) = cos(…)</p>
            </div>
          )}
          {method === "learned" && (
            <div className="flex flex-col gap-2 text-sm text-slate-300">
              <p>
                GPT-2 / BERT style: a second lookup table with one <b>trained</b> vector per position (0, 1, 2, … up to the max
                context length), also <b>added</b> to the token embedding.
              </p>
              {TOKENS.map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-12 font-mono text-[11px] text-slate-500">P[{i}]</span>
                  <VectorCells values={seededVector(500 + i * 7, EMBED_DIM)} cell={14} delay={i * 0.05} />
                </div>
              ))}
            </div>
          )}
          {method === "rope" && <RopeDemo pos={sel} />}
        </div>
      </div>
    </div>
  );
}

function Row({ label, values, k, delay = 0, highlight }: { label: string; values: number[]; k: string; delay?: number; highlight?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-lg p-1.5 ${highlight ? "bg-cyan-400/10" : ""}`}>
      <span className="w-32 text-slate-400">{label}</span>
      <VectorCells key={k} values={values} cell={22} showValues delay={delay} />
    </div>
  );
}

function RopeDemo({ pos }: { pos: number }) {
  const angle = pos * 32; // degrees, illustrative rotation per position
  return (
    <div className="flex flex-col gap-2 text-sm text-slate-300">
      <p>
        Used in LLaMA and many other modern LLMs: instead of adding a vector, RoPE <b>rotates</b> the query and key vectors
        inside attention by an angle proportional to position. Their dot product then depends on the{" "}
        <b>relative distance</b> between tokens.
      </p>
      <svg viewBox="-60 -60 120 120" className="mx-auto h-40 w-40">
        <circle r={45} fill="none" stroke="#334155" strokeDasharray="2 3" />
        <line x1={-55} x2={55} y1={0} y2={0} stroke="#1e293b" />
        <line y1={-55} y2={55} x1={0} x2={0} stroke="#1e293b" />
        <line x1={0} y1={0} x2={40} y2={0} stroke="#475569" strokeWidth={2} strokeDasharray="3 2" />
        <motion.g animate={{ rotate: -angle }} transition={{ type: "spring", stiffness: 80, damping: 12 }}>
          <line x1={0} y1={0} x2={40} y2={0} stroke="#22d3ee" strokeWidth={3} />
          <circle cx={40} cy={0} r={4} fill="#22d3ee" />
        </motion.g>
        <text x={0} y={56} textAnchor="middle" fill="#94a3b8" fontSize={8}>
          q at pos {pos}: rotated {angle}°
        </text>
      </svg>
      <p className="text-xs text-slate-500">Click a token on the left to change the position.</p>
    </div>
  );
}
