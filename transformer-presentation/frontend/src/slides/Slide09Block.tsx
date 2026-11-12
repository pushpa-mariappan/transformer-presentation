import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const STAGES = [
  { label: "x  (token vectors in)", y: 520, color: "#94a3b8", text: "Each token's vector enters the block. Here we follow the vector for “loan”." },
  { label: "LayerNorm", y: 452, color: "#64748b", text: "Normalise each vector (mean 0, unit variance, then learned scale and shift) to keep the numbers stable." },
  { label: "Masked Multi-Head Attention", y: 380, color: "#22d3ee", text: "Mix in information from earlier tokens. “loan” gathers context from “bank” and “approved”." },
  { label: "⊕  add residual", y: 312, color: "#a3e635", text: "x ← x + Attention(LN(x)). The original vector is kept and the attention result is added on top." },
  { label: "LayerNorm", y: 252, color: "#64748b", text: "Normalise again before the feed-forward network." },
  { label: "Feed-Forward Network", y: 180, color: "#a855f7", text: "Per token: expand to ~4× width, apply a nonlinearity (GELU), project back. No mixing between tokens here." },
  { label: "⊕  add residual", y: 112, color: "#a3e635", text: "x ← x + FFN(LN(x)). This output goes on to the next block." },
  { label: "x′  (refined vectors out)", y: 44, color: "#f472b6", text: "Same shape as the input, one vector per token, now carrying more context." },
];
const CX = 160;

export default function Slide09Block() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 1700);
    return () => clearInterval(t);
  }, [playing]);

  const cur = STAGES[stage];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="rounded-xl border border-white/10 bg-ink-950/60 p-2">
        <svg viewBox="0 0 330 560" className="mx-auto max-h-[60vh] w-full">
          <rect x={20} y={88} width={290} height={392} rx={16} fill="none" stroke="#6366f1" strokeDasharray="6 4" />
          <text x={30} y={472} fill="#a5b4fc" fontSize={11} fontFamily="JetBrains Mono">
            one Transformer block
          </text>
          <line x1={CX} x2={CX} y1={44} y2={520} stroke="#334155" strokeWidth={2} />
          {/* residual skips */}
          <path
            d={`M ${CX} 490 H 290 V 312 H ${CX + 14}`}
            fill="none"
            stroke="#a3e635"
            strokeWidth={stage === 3 ? 3.5 : 1.5}
            strokeOpacity={stage === 3 ? 1 : 0.45}
            strokeDasharray="5 4"
          />
          <path
            d={`M ${CX} 296 H 290 V 112 H ${CX + 14}`}
            fill="none"
            stroke="#a3e635"
            strokeWidth={stage === 6 ? 3.5 : 1.5}
            strokeOpacity={stage === 6 ? 1 : 0.45}
            strokeDasharray="5 4"
          />
          {STAGES.map((s, i) => {
            const active = i === stage;
            const isAdd = s.label.startsWith("⊕");
            return (
              <g
                key={i}
                className="cursor-pointer"
                onClick={() => {
                  setStage(i);
                  setPlaying(false);
                }}
              >
                {isAdd ? (
                  <circle cx={CX} cy={s.y} r={14} fill={active ? `${s.color}55` : "#0a0c1b"} stroke={s.color} strokeWidth={active ? 2.5 : 1.5} />
                ) : (
                  <rect
                    x={CX - 105}
                    y={s.y - 19}
                    width={210}
                    height={38}
                    rx={10}
                    fill={active ? `${s.color}45` : `${s.color}15`}
                    stroke={s.color}
                    strokeWidth={active ? 2.5 : 1}
                    style={{ filter: active ? `drop-shadow(0 0 10px ${s.color})` : undefined }}
                  />
                )}
                <text x={isAdd ? CX : CX} y={s.y + 4.5} textAnchor="middle" fill="#e2e8f0" fontSize={isAdd ? 16 : 13} fontWeight={600} pointerEvents="none">
                  {isAdd ? "+" : s.label}
                </text>
              </g>
            );
          })}
          {/* the travelling vector */}
          <motion.g animate={{ y: cur.y }} transition={{ type: "spring", stiffness: 70, damping: 14 }}>
            {[0, 1, 2, 3].map((k) => (
              <motion.rect
                key={k}
                x={10 + k * 9}
                y={-6}
                width={8}
                height={12}
                rx={2}
                animate={{ fill: ["#22d3ee", "#a855f7", "#f472b6", "#a3e635", "#22d3ee"][(stage + k) % 5] }}
              />
            ))}
          </motion.g>
        </svg>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-ghost !py-1.5 text-xs" onClick={() => setPlaying((p) => !p)}>
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <span className="font-mono text-xs text-slate-500">
            step {stage + 1} / {STAGES.length}
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border p-4"
            style={{ borderColor: `${cur.color}77`, background: `${cur.color}12` }}
          >
            <div className="text-lg font-bold" style={{ color: cur.color }}>
              {cur.label.replace("⊕  ", "")}
            </div>
            <p className="text-sm text-slate-300">{cur.text}</p>
          </motion.div>
        </AnimatePresence>
        <FFNDetail active={stage === 5} />
      </div>
    </div>
  );
}

function FFNDetail({ active }: { active: boolean }) {
  const inN = 4,
    hidN = 12,
    outN = 4;
  const ys = (n: number) => Array.from({ length: n }, (_, i) => 12 + (i * 136) / (n - 1));
  const [a, b, c] = [ys(inN), ys(hidN), ys(outN)];
  const gelu = (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
  const curve = Array.from({ length: 41 }, (_, i) => {
    const x = -4 + i * 0.2;
    return `${i ? "L" : "M"} ${250 + x * 12} ${110 - gelu(x) * 12}`;
  }).join(" ");
  return (
    <div className={`rounded-xl border p-3 transition ${active ? "border-purple-400/60 bg-purple-400/10" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="kicker mb-1 !text-purple-300">Inside the feed-forward network (per token)</div>
      <svg viewBox="0 0 310 160" className="w-full">
        {a.map((y1, i) => b.map((y2, j) => <line key={`a${i}${j}`} x1={20} y1={y1} x2={100} y2={y2} stroke="#a855f7" strokeOpacity={0.15} />))}
        {b.map((y1, i) => c.map((y2, j) => <line key={`b${i}${j}`} x1={100} y1={y1} x2={180} y2={y2} stroke="#a855f7" strokeOpacity={0.15} />))}
        {a.map((y, i) => (
          <circle key={`na${i}`} cx={20} cy={y} r={5} fill="#22d3ee" />
        ))}
        {b.map((y, i) => (
          <motion.circle
            key={`nb${i}`}
            cx={100}
            cy={y}
            r={4}
            fill="#a855f7"
            animate={{ opacity: active ? [0.2, (i * 7) % 3 === 0 ? 0.2 : 1, 0.2] : 0.5 }}
            transition={{ duration: 1.2, repeat: active ? Infinity : 0, delay: i * 0.05 }}
          />
        ))}
        {c.map((y, i) => (
          <circle key={`nc${i}`} cx={180} cy={y} r={5} fill="#f472b6" />
        ))}
        <text x={20} y={158} textAnchor="middle" fill="#94a3b8" fontSize={9}>d</text>
        <text x={100} y={158} textAnchor="middle" fill="#94a3b8" fontSize={9}>≈4d + GELU</text>
        <text x={180} y={158} textAnchor="middle" fill="#94a3b8" fontSize={9}>d</text>
        <line x1={200} x2={300} y1={110} y2={110} stroke="#334155" />
        <line x1={250} x2={250} y1={40} y2={140} stroke="#334155" />
        <path d={curve} fill="none" stroke="#a855f7" strokeWidth={2.5} />
        <text x={262} y={50} fill="#d8b4fe" fontSize={10}>GELU</text>
      </svg>
      <p className="text-xs text-slate-400">
        Without the nonlinearity, stacked linear layers would collapse into one linear map. GELU (or SwiGLU) lets the
        network learn non-linear features.
      </p>
    </div>
  );
}
