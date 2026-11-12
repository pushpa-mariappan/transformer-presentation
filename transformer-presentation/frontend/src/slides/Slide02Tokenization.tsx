import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Note } from "../components/viz";
import { SENTENCE, TOKENS } from "../lib/sentence";

const SUBWORDS = [
  { word: "unbelievably", pieces: ["un", "believ", "ably"] },
  { word: "tokenization", pieces: ["token", "ization"] },
  { word: "loan", pieces: ["loan"] },
];

export default function Slide02Tokenization() {
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState<number | null>(1);
  const [run, setRun] = useState(0);

  useEffect(() => {
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 900);
    const t2 = setTimeout(() => setStage(2), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [run]);

  const sel = selected !== null ? TOKENS[selected] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 font-mono text-xs">
          {["1 · Text", "2 · Tokens", "3 · Token IDs"].map((s, i) => (
            <button
              key={s}
              onClick={() => setStage(i)}
              className={`rounded-full px-3 py-1 transition ${stage >= i ? "bg-cyan-400/20 text-cyan-200" : "bg-white/5 text-slate-500"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="btn-ghost !py-1.5 text-xs" onClick={() => setRun((r) => r + 1)}>
          ↻ Replay
        </button>
      </div>

      {/* Stage area */}
      <div className="relative flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-ink-950/60 p-4 sm:p-8">
        <AnimatePresence mode="wait">
          {stage === 0 ? (
            <motion.div
              key="text"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
              className="text-center text-3xl font-bold tracking-tight sm:text-5xl"
            >
              “{SENTENCE}”
            </motion.div>
          ) : (
            <motion.div key="tokens" className="flex flex-wrap items-start justify-center gap-2 sm:gap-3">
              {TOKENS.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -30, rotate: (i % 2 ? 1 : -1) * 8 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: i * 0.12, type: "spring", stiffness: 220, damping: 16 }}
                  className="flex flex-col items-center gap-2"
                >
                  <button
                    onClick={() => setSelected(i)}
                    className="rounded-xl border-2 px-3 py-2 font-mono text-lg font-semibold transition hover:-translate-y-0.5 sm:px-4 sm:text-2xl"
                    style={{
                      borderColor: selected === i ? t.color : `${t.color}66`,
                      background: selected === i ? `${t.color}30` : `${t.color}10`,
                      color: t.color,
                      boxShadow: selected === i ? `0 0 28px -6px ${t.color}` : undefined,
                    }}
                  >
                    {t.raw.startsWith(" ") && <span className="text-slate-500">␣</span>}
                    {t.text}
                  </button>
                  <AnimatePresence>
                    {stage >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center"
                      >
                        <span className="text-slate-500">↓</span>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-sm text-slate-100 sm:text-base">
                          {t.id}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="kicker mb-2">Selected token</div>
          {sel ? (
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-sm">
              <span className="text-slate-500">string</span>
              <span style={{ color: sel.color }}>"{sel.raw.replace(/ /g, "␣")}"</span>
              <span className="text-slate-500">token ID</span>
              <span>{sel.id}</span>
              <span className="text-slate-500">position</span>
              <span>{selected}</span>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Click a token.</p>
          )}
          <p className="mt-3 text-xs text-slate-400">
            ␣ marks a leading space. Many tokenizers keep the space inside the token, so “␣bank” and “bank” can have
            different IDs.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="kicker mb-2">Sub-word tokens</div>
          <div className="flex flex-col gap-2">
            {SUBWORDS.map((w) => (
              <div key={w.word} className="flex flex-wrap items-center gap-1.5 font-mono text-sm">
                <span className="w-28 text-slate-400">{w.word}</span>
                <span className="text-slate-600">→</span>
                {w.pieces.map((p, i) => (
                  <motion.span
                    key={p}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    className="rounded-md border border-purple-400/40 bg-purple-400/10 px-2 py-0.5 text-purple-200"
                  >
                    {p}
                  </motion.span>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Rare words split into frequent pieces, so a fixed vocabulary (~32k–200k entries) can cover any text.</p>
        </div>
      </div>

      <Note>
        Illustrative tokenization: these splits and IDs are examples, not the exact output of a specific tokenizer.
        Real tokenizers (BPE, WordPiece, SentencePiece) differ in their splits and IDs.
      </Note>
    </div>
  );
}
