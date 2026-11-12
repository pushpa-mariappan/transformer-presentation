import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FlowDot, Segmented } from "../components/viz";

interface Info {
  title: string;
  body: string;
  color: string;
}

const INFO: Record<string, Info> = {
  tokens: { title: "Input tokens", color: "#94a3b8", body: "Token IDs from the tokenizer, e.g. “The bank approved the” → [1032, 4521, 8807, 262]." },
  embed: { title: "Token embedding", color: "#3b82f6", body: "Looks up a learned vector for each token ID. Turns integers into d-dimensional vectors the network can compute with." },
  pos: { title: "Positional information", color: "#38bdf8", body: "Injects word order: added position vectors (sinusoidal or learned), or rotary embeddings (RoPE) applied to Q and K inside attention." },
  ln1: { title: "Layer normalization", color: "#64748b", body: "Rescales each token's vector to a stable range before the sub-layer. Modern LLMs normalise first (pre-LN), which trains more stably in deep stacks." },
  attn: { title: "Masked multi-head self-attention", color: "#22d3ee", body: "The only place tokens exchange information. Each token mixes in information from itself and earlier tokens. The causal mask hides future tokens." },
  add1: { title: "Residual connection", color: "#a3e635", body: "Adds the sub-layer's output to its input: x + Attention(LN(x)). Information and gradients get a shortcut, so deep stacks can train." },
  ln2: { title: "Layer normalization", color: "#64748b", body: "Normalises again before the feed-forward network." },
  ffn: { title: "Feed-forward network", color: "#a855f7", body: "A small 2-layer MLP applied to each token separately: expand (≈4×d), nonlinearity (GELU/SwiGLU), project back to d." },
  add2: { title: "Residual connection", color: "#a3e635", body: "x + FFN(LN(x)). The block's output is the next block's input, the so-called residual stream." },
  lnf: { title: "Final layer normalization", color: "#64748b", body: "Normalises the last block's output before projecting to the vocabulary." },
  proj: { title: "Output projection", color: "#f472b6", body: "A linear layer (d → vocabulary size) gives one score, a logit, per vocabulary token. Often shares weights with the embedding matrix." },
  softmax: { title: "Softmax", color: "#fb7185", body: "Turns logits into a probability distribution over the vocabulary for the next token." },
  // encoder-decoder view
  enc: { title: "Encoder stack", color: "#3b82f6", body: "Reads the whole source sentence with bidirectional self-attention: every token can see every other token." },
  dec_self: { title: "Masked self-attention", color: "#22d3ee", body: "The decoder attends to the tokens it has generated so far (causal)." },
  cross: { title: "Cross-attention", color: "#f59e0b", body: "Decoder queries attend to the encoder's outputs (keys and values), so generation can look at the source sentence. Used in translation." },
  dec_ffn: { title: "Feed-forward network", color: "#a855f7", body: "Same position-wise MLP as in the encoder." },
};

function Node({
  id,
  x,
  y,
  w,
  h,
  label,
  sel,
  onSel,
  delay = 0,
}: {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sel: string;
  onSel: (id: string) => void;
  delay?: number;
}) {
  const c = INFO[id].color;
  const active = sel === id;
  return (
    <motion.g
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={() => onSel(id)}
      className="cursor-pointer"
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={active ? `${c}40` : `${c}18`}
        stroke={c}
        strokeWidth={active ? 2.5 : 1.2}
        style={{ filter: active ? `drop-shadow(0 0 10px ${c})` : undefined, transition: "all .2s" }}
      />
      <text x={x + w / 2} y={y + h / 2 + 4.5} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontWeight={600} pointerEvents="none">
        {label}
      </text>
    </motion.g>
  );
}

function Plus({ id, cx, cy, sel, onSel }: { id: string; cx: number; cy: number; sel: string; onSel: (id: string) => void }) {
  const active = sel === id;
  return (
    <g onClick={() => onSel(id)} className="cursor-pointer">
      <circle cx={cx} cy={cy} r={12} fill={active ? "#a3e63540" : "#0a0c1b"} stroke="#a3e635" strokeWidth={active ? 2.5 : 1.5} />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#a3e635" fontSize={16} fontWeight={700} pointerEvents="none">
        +
      </text>
    </g>
  );
}

function DecoderOnly({ sel, onSel }: { sel: string; onSel: (id: string) => void }) {
  const X = 90,
    W = 240,
    CX = X + W / 2;
  return (
    <svg viewBox="0 0 420 700" className="mx-auto max-h-[64vh] w-full">
      {/* spine */}
      <line x1={CX} x2={CX} y1={40} y2={660} stroke="#334155" strokeWidth={2} />
      {/* residual skips */}
      <path d={`M ${CX} 520 H 372 V 395 H ${CX + 12}`} fill="none" stroke="#a3e635" strokeOpacity={0.6} strokeWidth={1.8} strokeDasharray="5 4" />
      <path d={`M ${CX} 380 H 372 V 245 H ${CX + 12}`} fill="none" stroke="#a3e635" strokeOpacity={0.6} strokeWidth={1.8} strokeDasharray="5 4" />
      <text x={378} y={460} fill="#a3e635" fontSize={10} transform="rotate(90 378 460)">
        residual
      </text>

      {/* block frame */}
      <rect x={40} y={225} width={350} height={320} rx={18} fill="none" stroke="#6366f1" strokeDasharray="7 5" />
      <text x={52} y={537} fill="#a5b4fc" fontSize={12} fontFamily="JetBrains Mono" fontWeight={700}>
        Transformer block × N
      </text>

      <Node id="softmax" x={X} y={20} w={W} h={38} label="Softmax → probabilities" sel={sel} onSel={onSel} delay={1.2} />
      <Node id="proj" x={X} y={76} w={W} h={38} label="Output projection (→ logits)" sel={sel} onSel={onSel} delay={1.1} />
      <Node id="lnf" x={X} y={132} w={W} h={34} label="Final LayerNorm" sel={sel} onSel={onSel} delay={1.0} />
      <Plus id="add2" cx={CX} cy={245} sel={sel} onSel={onSel} />
      <Node id="ffn" x={X} y={268} w={W} h={46} label="Feed-Forward Network" sel={sel} onSel={onSel} delay={0.8} />
      <Node id="ln2" x={X} y={330} w={W} h={32} label="LayerNorm" sel={sel} onSel={onSel} delay={0.7} />
      <Plus id="add1" cx={CX} cy={395} sel={sel} onSel={onSel} />
      <Node id="attn" x={X} y={418} w={W} h={50} label="Masked Multi-Head Attention" sel={sel} onSel={onSel} delay={0.5} />
      <Node id="ln1" x={X} y={484} w={W} h={32} label="LayerNorm" sel={sel} onSel={onSel} delay={0.4} />
      <Node id="pos" x={X} y={562} w={W} h={34} label="+ Positional information" sel={sel} onSel={onSel} delay={0.25} />
      <Node id="embed" x={X} y={606} w={W} h={34} label="Token Embedding" sel={sel} onSel={onSel} delay={0.15} />
      <Node id="tokens" x={X} y={652} w={W} h={34} label="The · bank · approved · the" sel={sel} onSel={onSel} delay={0} />

      <FlowDot path={`M ${CX} 652 L ${CX} 58`} duration={4} />
      <FlowDot path={`M ${CX} 652 L ${CX} 58`} duration={4} delay={2} color="#a855f7" />
    </svg>
  );
}

function EncoderDecoder({ sel, onSel }: { sel: string; onSel: (id: string) => void }) {
  return (
    <svg viewBox="0 0 440 460" className="mx-auto max-h-[60vh] w-full">
      <rect x={10} y={120} width={180} height={230} rx={16} fill="#3b82f612" stroke="#3b82f6" strokeDasharray="6 4" />
      <text x={20} y={140} fill="#93c5fd" fontSize={12} fontFamily="JetBrains Mono">
        Encoder × N
      </text>
      <Node id="enc" x={25} y={160} w={150} h={44} label="Self-Attention" sel={sel} onSel={onSel} />
      <Node id="enc" x={25} y={220} w={150} h={44} label="Feed-Forward" sel={sel} onSel={onSel} />
      <text x={100} y={300} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        bidirectional: sees all tokens
      </text>
      <text x={100} y={390} textAnchor="middle" fill="#cbd5e1" fontSize={12}>
        source: “Die Bank genehmigte…”
      </text>
      <line x1={100} x2={100} y1={375} y2={352} stroke="#64748b" />

      <rect x={240} y={60} width={190} height={290} rx={16} fill="#a855f712" stroke="#a855f7" strokeDasharray="6 4" />
      <text x={250} y={80} fill="#d8b4fe" fontSize={12} fontFamily="JetBrains Mono">
        Decoder × N
      </text>
      <Node id="dec_ffn" x={255} y={95} w={160} h={44} label="Feed-Forward" sel={sel} onSel={onSel} />
      <Node id="cross" x={255} y={170} w={160} h={44} label="Cross-Attention" sel={sel} onSel={onSel} />
      <Node id="dec_self" x={255} y={245} w={160} h={44} label="Masked Self-Attn" sel={sel} onSel={onSel} />
      <text x={335} y={390} textAnchor="middle" fill="#cbd5e1" fontSize={12}>
        target so far: “The bank…”
      </text>
      <line x1={335} x2={335} y1={375} y2={352} stroke="#64748b" />
      <path d="M 175 182 C 210 182, 220 192, 255 192" stroke="#f59e0b" strokeWidth={2} fill="none" />
      <FlowDot path="M 175 182 C 210 182, 220 192, 255 192" color="#f59e0b" duration={1.6} />
      <text x={215} y={172} textAnchor="middle" fill="#fbbf24" fontSize={10}>
        K, V
      </text>
      <text x={220} y={440} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        Original 2017 design (translation). Decoder-only LLMs keep just the right-hand stack, minus cross-attention.
      </text>
    </svg>
  );
}

export default function Slide05Architecture() {
  const [view, setView] = useState<"dec" | "encdec">("dec");
  const [sel, setSel] = useState("attn");
  const info = INFO[sel];

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        value={view}
        onChange={(v) => {
          setView(v);
          setSel(v === "dec" ? "attn" : "cross");
        }}
        options={[
          { value: "dec", label: "Decoder-only (GPT-style LLMs)" },
          { value: "encdec", label: "Original encoder–decoder" },
        ]}
      />
      <div className="grid items-start gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-2">
          {view === "dec" ? <DecoderOnly sel={sel} onSel={setSel} /> : <EncoderDecoder sel={sel} onSel={setSel} />}
        </div>
        <div className="flex flex-col gap-3 md:sticky md:top-4">
          <div className="text-xs text-slate-400">👆 Click any component</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={sel}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="rounded-xl border p-4"
              style={{ borderColor: `${info.color}66`, background: `${info.color}10` }}
            >
              <div className="mb-1 text-lg font-bold" style={{ color: info.color }}>
                {info.title}
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{info.body}</p>
            </motion.div>
          </AnimatePresence>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
            For the rest of the talk we follow the <b className="text-slate-200">decoder-only</b> path: a single stack
            that reads the prompt and predicts the next token.
          </div>
        </div>
      </div>
    </div>
  );
}
