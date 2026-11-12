import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { AnswerRecord, PublicQuestion, Stats } from "../lib/types";

const LETTERS = ["A", "B", "C", "D"];

/** Interactive quiz for participants. Results come from the server (the answer key never reaches the client). */
export function QuizPanel({
  questions,
  answers,
  connected,
  onSubmit,
}: {
  questions: PublicQuestion[];
  answers: Record<string, AnswerRecord>;
  connected: boolean;
  onSubmit: (questionId: string, choice: number) => boolean;
}) {
  if (!questions.length) return null;
  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          q={q}
          index={i}
          total={questions.length}
          result={answers[q.id]}
          connected={connected}
          onSubmit={onSubmit}
        />
      ))}
    </div>
  );
}

function QuestionCard({
  q,
  index,
  total,
  result,
  connected,
  onSubmit,
}: {
  q: PublicQuestion;
  index: number;
  total: number;
  result?: AnswerRecord;
  connected: boolean;
  onSubmit: (questionId: string, choice: number) => boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (result) setPending(false);
  }, [result]);

  // Recover if the connection dropped mid-submit: the server either recorded it (result arrives on reconnect) or not.
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(false), 6000);
    return () => clearTimeout(t);
  }, [pending]);

  const locked = !!result;
  const shown = result ? result.choice : selected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.1 }}
      className="panel border-purple-400/30 p-4 sm:p-5"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="kicker !text-purple-300">
          Quiz {total > 1 ? `${index + 1}/${total}` : ""}
        </span>
        {result && (
          <span className={`text-xs font-bold ${result.correct ? "text-emerald-300" : "text-rose-300"}`}>
            {result.correct ? "+1 point" : "0 points"}
          </span>
        )}
      </div>
      <p className="mb-3 font-semibold leading-snug text-slate-100">{q.prompt}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const isCorrect = !!result && result.correctChoice === i;
          const isWrongPick = !!result && result.choice === i && !result.correct;
          const isSel = shown === i;
          return (
            <button
              key={i}
              disabled={locked || pending}
              onClick={() => setSelected(i)}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                isCorrect
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-50"
                  : isWrongPick
                    ? "border-rose-400 bg-rose-400/15 text-rose-50"
                    : isSel
                      ? "border-cyan-300 bg-cyan-400/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:bg-white/[0.06]"
              } ${locked && !isCorrect && !isWrongPick ? "opacity-50" : ""}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
                  isCorrect ? "bg-emerald-400 text-ink-950" : isWrongPick ? "bg-rose-400 text-ink-950" : isSel ? "bg-cyan-300 text-ink-950" : "bg-white/10"
                }`}
              >
                {isCorrect ? "✓" : isWrongPick ? "✗" : LETTERS[i]}
              </span>
              <span className="pt-0.5">{opt}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`mt-3 rounded-xl border p-3 text-sm ${
              result.correct ? "border-emerald-400/40 bg-emerald-400/10" : "border-rose-400/40 bg-rose-400/10"
            }`}
          >
            <div className="mb-1 font-bold">{result.correct ? "🎉 Correct!" : "Not quite."}</div>
            <p className="text-slate-300">{result.explanation}</p>
          </motion.div>
        ) : (
          <motion.button
            key="submit"
            className="btn-primary mt-3 w-full"
            disabled={selected === null || pending || !connected}
            onClick={() => {
              if (selected === null) return;
              if (onSubmit(q.id, selected)) setPending(true);
            }}
          >
            {!connected ? "Reconnecting…" : pending ? "Submitting…" : "Submit answer"}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Read-only quiz display for the projector screen and presenter: shows how many have answered. */
export function QuizStatus({
  questions,
  stats,
  participantCount,
  showDistribution = false,
}: {
  questions: PublicQuestion[];
  stats: Stats | null;
  participantCount: number;
  showDistribution?: boolean;
}) {
  if (!questions.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {questions.map((q) => {
        const answered = stats?.answered[q.id] ?? 0;
        const dist = stats?.distribution?.[q.id];
        const correct = stats?.correct?.[q.id];
        const pct = participantCount ? Math.min(100, (answered / participantCount) * 100) : 0;
        return (
          <div key={q.id} className="panel border-purple-400/30 p-4">
            <div className="kicker mb-1 !text-purple-300">Quiz</div>
            <p className="mb-2 text-sm font-semibold text-slate-100">{q.prompt}</p>
            {showDistribution && dist ? (
              <div className="mb-3 flex flex-col gap-1.5">
                {q.options.map((opt, i) => {
                  const n = dist[i] ?? 0;
                  const w = answered ? (n / answered) * 100 : 0;
                  return (
                    <div key={i} className="text-xs">
                      <div className="mb-0.5 flex justify-between gap-2">
                        <span className={`truncate ${i === correct ? "text-emerald-300" : "text-slate-300"}`}>
                          {LETTERS[i]}. {opt} {i === correct && "✓"}
                        </span>
                        <span className="font-mono text-slate-400">{n}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          className={`h-full rounded-full ${i === correct ? "bg-emerald-400" : "bg-slate-400/60"}`}
                          animate={{ width: `${w}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul className="mb-3 flex flex-col gap-1 text-xs text-slate-400">
                {q.options.map((opt, i) => (
                  <li key={i}>
                    <b className="text-slate-300">{LETTERS[i]}.</b> {opt}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Answered</span>
              <span className="font-mono font-bold text-cyan-200">
                {answered} / {participantCount}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" animate={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
