import { motion } from "framer-motion";
import { useCallback, useState, type FormEvent } from "react";
import { Celebration } from "../components/Celebration";
import { QuizPanel } from "../components/QuizPanel";
import { SlideStage } from "../components/SlideStage";
import { TopBar } from "../components/TopBar";
import { FloatingTokens, PRESENTATION_SUBTITLE, PRESENTATION_TITLE, WaitingRoom } from "../components/WaitingRoom";
import { clearSession, joinPresentation, loadSession, saveSession, type StoredSession } from "../lib/session";
import { useLiveSession } from "../lib/useLiveSession";

export default function ParticipantPage() {
  const [session, setSession] = useState<StoredSession | null>(() => loadSession());

  if (!session) {
    return (
      <JoinForm
        onJoined={(s) => {
          saveSession(s);
          setSession(s);
        }}
      />
    );
  }
  return (
    <LivePresentation
      session={session}
      onLeave={() => {
        clearSession();
        setSession(null);
      }}
    />
  );
}

function JoinForm({ onJoined }: { onJoined: (s: StoredSession) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      onJoined(await joinPresentation(name.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <FloatingTokens />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex w-full max-w-xl flex-col items-center gap-8 text-center"
      >
        <motion.div
          className="flex gap-1.5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          {["The", "bank", "approved", "the", "loan", "."].map((w, i) => (
            <motion.span
              key={i}
              variants={{ hidden: { opacity: 0, y: -12 }, show: { opacity: 1, y: 0 } }}
              className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 font-mono text-xs text-cyan-200"
            >
              {w}
            </motion.span>
          ))}
        </motion.div>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            <span className="gradient-text">{PRESENTATION_TITLE}</span>
          </h1>
          <p className="text-lg text-slate-300 sm:text-2xl">{PRESENTATION_SUBTITLE}</p>
        </div>
        <form onSubmit={submit} className="panel flex w-full flex-col gap-3 p-5 sm:p-6">
          <label htmlFor="username" className="text-left text-sm font-medium text-slate-300">
            Your name
          </label>
          <input
            id="username"
            autoFocus
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya"
            className="rounded-xl border border-white/15 bg-ink-950/80 px-4 py-3 text-lg text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
          />
          {error && <p className="text-left text-sm text-rose-300">{error}</p>}
          <button className="btn-primary py-3 text-lg" disabled={busy || !name.trim()}>
            {busy ? "Joining…" : "Join Presentation →"}
          </button>
          <p className="text-xs text-slate-500">No password needed. Your name shows on the leaderboard.</p>
        </form>
      </motion.div>
    </div>
  );
}

function LivePresentation({ session, onLeave }: { session: StoredSession; onLeave: () => void }) {
  const { state, send } = useLiveSession({ role: "participant", token: session.token, onInvalidSession: onLeave });

  const submit = useCallback((questionId: string, choice: number) => send({ type: "answer", questionId, choice }), [send]);
  const score = state.me?.score ?? 0;

  const right = (
    <>
      <span className="max-w-[9rem] truncate text-sm text-slate-300">👤 {session.username}</span>
      <span className="rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-2.5 py-1 font-mono text-sm font-bold text-cyan-100 ring-1 ring-cyan-300/30">
        {score} pt{score === 1 ? "" : "s"}
      </span>
    </>
  );

  if (state.phase === "ended") {
    return (
      <>
        <TopBar connected={state.connected} right={right} />
        <Celebration me={state.me} leaderboard={state.leaderboard} total={state.totalQuestions} />
      </>
    );
  }

  if (state.phase === "waiting") {
    return (
      <>
        <TopBar connected={state.connected} right={right} />
        <WaitingRoom
          username={session.username}
          startsAt={state.startsAt}
          clockOffset={state.clockOffset}
          participantCount={state.participantCount}
          names={state.names}
        />
      </>
    );
  }

  return (
    <>
      <TopBar connected={state.connected} slide={state.slide} totalSlides={state.totalSlides} right={right} />
      <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-6 sm:py-6">
        <SlideStage
          slide={state.slide}
          replayNonce={state.replayNonce}
          aside={
            <QuizPanel
              key={state.slide}
              questions={state.questions}
              answers={state.me?.answers ?? {}}
              connected={state.connected}
              onSubmit={submit}
            />
          }
        />
        <p className="mt-6 text-center text-xs text-slate-600">The presenter controls the slides. Explore the diagram and answer the quiz.</p>
      </main>
    </>
  );
}
