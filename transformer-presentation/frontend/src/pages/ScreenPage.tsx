import { Confetti } from "../components/Confetti";
import { Leaderboard } from "../components/Leaderboard";
import { QuizStatus } from "../components/QuizPanel";
import { SlideStage } from "../components/SlideStage";
import { TopBar } from "../components/TopBar";
import { WaitingRoom } from "../components/WaitingRoom";
import { useLiveSession } from "../lib/useLiveSession";

/** Read-only projector view: follows the presenter, shows answer counts instead of quiz controls. */
export default function ScreenPage() {
  const { state } = useLiveSession({ role: "screen" });
  const joinUrl = `${location.host}`;

  if (state.phase === "waiting") {
    return (
      <WaitingRoom
        startsAt={state.startsAt}
        clockOffset={state.clockOffset}
        participantCount={state.participantCount}
        names={state.names}
        joinUrl={joinUrl}
      />
    );
  }

  if (state.phase === "ended") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-10">
        <Confetti />
        <div className="text-7xl">🏆</div>
        <h1 className="text-center text-5xl font-extrabold">
          <span className="gradient-text">Congratulations, everyone!</span>
        </h1>
        <div className="w-full">
          <Leaderboard entries={state.leaderboard} total={state.totalQuestions} limit={10} title="Final leaderboard" />
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar
        connected={state.connected}
        slide={state.slide}
        totalSlides={state.totalSlides}
        right={<span className="font-mono text-sm text-slate-400">join: {joinUrl}</span>}
      />
      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-8">
        <SlideStage
          slide={state.slide}
          replayNonce={state.replayNonce}
          aside={<QuizStatus questions={state.questions} stats={state.stats} participantCount={state.participantCount} />}
        />
      </main>
    </>
  );
}
