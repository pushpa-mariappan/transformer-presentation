import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Leaderboard } from "../components/Leaderboard";
import { QuizStatus } from "../components/QuizPanel";
import { SlideStage } from "../components/SlideStage";
import { ConnectionDot } from "../components/TopBar";
import { useCountdown, useLiveSession } from "../lib/useLiveSession";
import { loadPresenterKey, presenterLogin, savePresenterKey } from "../lib/session";
import { SLIDES } from "../slides";

export default function PresenterPage() {
  const [key, setKey] = useState<string | null>(() => loadPresenterKey());
  if (!key) return <PresenterLogin onKey={(k) => (savePresenterKey(k), setKey(k))} />;
  return (
    <Dashboard
      presenterKey={key}
      onLogout={() => {
        savePresenterKey(null);
        setKey(null);
      }}
    />
  );
}

function PresenterLogin({ onKey }: { onKey: (k: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (await presenterLogin(value)) onKey(value);
      else setError("Invalid presenter key");
    } catch {
      setError("Server unreachable");
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="panel flex w-full max-w-sm flex-col gap-3 p-6">
        <div className="kicker">Presenter</div>
        <h1 className="text-2xl font-bold">Presenter dashboard</h1>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Presenter key"
          className="rounded-xl border border-white/15 bg-ink-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
        />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button className="btn-primary">Enter</button>
        <p className="text-xs text-slate-500">Set with the PRESENTER_KEY environment variable on the server (default: “transformer”).</p>
      </form>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="panel flex flex-col gap-1 p-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="font-mono text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Dashboard({ presenterKey, onLogout }: { presenterKey: string; onLogout: () => void }) {
  const { state, send } = useLiveSession({ role: "presenter", presenterKey, onInvalidSession: onLogout });
  const [minutes, setMinutes] = useState(5);
  // Two-click confirm for "End Presentation" (no browser alert in front of the audience)
  const [confirmEnd, setConfirmEnd] = useState(false);
  useEffect(() => {
    if (!confirmEnd) return;
    const t = setTimeout(() => setConfirmEnd(false), 4000);
    return () => clearTimeout(t);
  }, [confirmEnd]);
  const remaining = useCountdown(state.startsAt, state.clockOffset);
  const live = state.phase === "live";

  const cmd = (type: string, extra: Record<string, unknown> = {}) => send({ type, ...extra });

  // Keyboard / clicker support: → / PageDown / Space = next, ← / PageUp = previous, R = replay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!live) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        send({ type: "next" });
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        send({ type: "prev" });
      } else if (e.key.toLowerCase() === "r") {
        send({ type: "replay" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, send]);

  const totalAnswered = state.questions.reduce((s, q) => s + (state.stats?.answered[q.id] ?? 0), 0);
  const possible = state.questions.length * state.participantCount;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <span className="text-2xl">🎛️</span>
        <h1 className="text-xl font-bold">Presenter Dashboard</h1>
        <ConnectionDot connected={state.connected} />
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300">{state.phase}</span>
        <div className="ml-auto flex items-center gap-2">
          <a href="/screen" target="_blank" rel="noreferrer" className="btn-ghost !py-1.5 text-sm">
            📽 Open projector view
          </a>
          <button className="btn-ghost !py-1.5 text-sm" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="panel flex flex-wrap items-center gap-2 p-3">
        {state.phase !== "live" && (
          <button className="btn-primary" onClick={() => cmd("start")} disabled={!state.connected}>
            ▶ Start Presentation
          </button>
        )}
        <button className="btn-ghost" onClick={() => cmd("prev")} disabled={!live || state.slide === 0}>
          ← Previous
        </button>
        <button className="btn-primary" onClick={() => cmd("next")} disabled={!live || state.slide >= state.totalSlides - 1}>
          Next Slide →
        </button>
        <button className="btn-ghost" onClick={() => cmd("replay")} disabled={!live}>
          ↻ Replay Animation
        </button>
        {live && (
          <button
            className={`btn border border-rose-400/50 text-rose-100 ${
              confirmEnd ? "animate-pulse bg-rose-500/60 hover:bg-rose-500/70" : "bg-rose-500/20 hover:bg-rose-500/30"
            }`}
            onClick={() => {
              if (confirmEnd) {
                setConfirmEnd(false);
                cmd("end");
              } else {
                setConfirmEnd(true);
              }
            }}
          >
            {confirmEnd ? "■ Click again to end" : "■ End Presentation"}
          </button>
        )}
        {state.phase === "ended" && (
          <button className="btn-ghost" onClick={() => cmd("resume")}>
            ⏮ Back to slides
          </button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          {state.phase === "waiting" && (
            <>
              <label className="text-slate-400" htmlFor="mins">
                Countdown
              </label>
              <input
                id="mins"
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-16 rounded-lg border border-white/15 bg-ink-950 px-2 py-1.5 text-center"
              />
              <span className="text-slate-400">min</span>
              <button className="btn-ghost !py-1.5" onClick={() => cmd("countdown", { minutes })}>
                Set
              </button>
              {state.startsAt && (
                <button className="btn-ghost !py-1.5" onClick={() => cmd("countdown", { minutes: 0 })}>
                  Clear
                </button>
              )}
            </>
          )}
          <button
            className="btn !py-1.5 text-xs text-slate-500 hover:text-rose-300"
            onClick={() =>
              confirm("Reset everything? This deletes ALL participants and scores and returns to the waiting room.") && cmd("reset")
            }
          >
            Reset session
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Current slide" value={live ? `${state.slide + 1} / ${state.totalSlides}` : "—"} sub={live ? SLIDES[state.slide]?.title : state.phase} />
        <Tile label="Connected participants" value={state.participantCount} sub={`${state.leaderboard.length} joined in total`} />
        <Tile
          label="Quiz submissions (this slide)"
          value={live ? `${totalAnswered} / ${possible}` : "—"}
          sub={`${state.questions.length} question${state.questions.length === 1 ? "" : "s"} on this slide`}
        />
        <Tile
          label="Countdown"
          value={remaining !== null ? `${Math.floor(remaining / 60000)}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0")}` : "—"}
          sub={state.phase === "waiting" ? "shown in the waiting room" : "presentation started"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-3">
          {/* slide jump strip */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {SLIDES.map((s, i) => (
              <button
                key={i}
                disabled={!live}
                onClick={() => cmd("goto", { slide: i })}
                className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs transition disabled:opacity-40 ${
                  live && i === state.slide ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
                title={s.title}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-dashed border-white/10 p-3">
            <div className="kicker mb-2">Preview: what everyone sees</div>
            {live ? (
              <SlideStage slide={state.slide} replayNonce={state.replayNonce} compact />
            ) : (
              <div className="p-10 text-center text-slate-400">
                {state.phase === "waiting" ? "Participants are in the waiting room." : "Final results are being shown."}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {live && state.questions.length > 0 && (
            <div>
              <div className="kicker mb-2">Live quiz results</div>
              <QuizStatus questions={state.questions} stats={state.stats} participantCount={state.participantCount} showDistribution />
            </div>
          )}
          <Leaderboard entries={state.leaderboard} total={state.totalQuestions} title="Scores" />
          <p className="text-xs text-slate-500">Shortcuts: → / Space / PageDown = next · ← / PageUp = previous · R = replay</p>
        </div>
      </div>
    </div>
  );
}
