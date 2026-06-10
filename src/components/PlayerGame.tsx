"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatedScore } from "@/components/AnimatedScore";
import { AnswerButton } from "@/components/AnswerButton";
import { CountdownOverlay, TimerBar } from "@/components/TimerBar";
import { Leaderboard } from "@/components/Leaderboard";
import { WinnerPodium } from "@/components/WinnerPodium";
import { LobbyScreen } from "@/components/LobbyScreen";
import { RtlText } from "@/components/RtlText";
import { useRoomState, useSession } from "@/hooks/useRoomState";
import { useScoreSnapshots } from "@/hooks/useScoreSnapshots";
import { COUNTDOWN_SECONDS } from "@/lib/constants";
import { shuffleOptions } from "@/lib/shuffle";
import type { AnswerOption } from "@/lib/types";

type Props = {
  pin: string;
};

export function PlayerGame({ pin }: Props) {
  const { state, error } = useRoomState(pin);
  const { value: playerId } = useSession(`answerini-player-${pin}`, "session");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const { startScores, questionStartScores } = useScoreSnapshots(state);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (state?.phase === "question") {
      setSelectedOption(null);
    }
  }, [state?.phase, state?.currentQuestionIndex]);

  const shuffledOptions: AnswerOption[] = useMemo(() => {
    if (!state?.currentQuestion || !playerId) return state?.currentQuestion?.options ?? [];
    if (!state.settings.shuffleAnswers) return state.currentQuestion.options;
    return shuffleOptions(state.currentQuestion.options, playerId + state.currentQuestion.id);
  }, [state, playerId]);

  const submitAnswer = async (optionId: string) => {
    if (!playerId || submitting || selectedOption) return;
    setSubmitting(true);
    setSelectedOption(optionId);
    try {
      const res = await fetch(`/api/rooms/${pin}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, optionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSelectedOption(null);
        throw new Error(data.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-xl font-bold text-red-300">{error}</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  const myRank = state?.players.find((p) => p.id === playerId);

  if (state.phase === "lobby") {
    return <LobbyScreen pin={pin} playerCount={state.playerCount} title={state.title} />;
  }

  if (state.phase === "finished") {
    return (
      <WinnerPodium
        players={state.players.slice(0, 10)}
        startScores={startScores}
        highlightId={playerId ?? undefined}
      />
    );
  }

  if (state.phase === "countdown" && state.countdownStartedAt) {
    const elapsed = Math.floor((now - state.countdownStartedAt) / 1000);
    const remaining = Math.max(1, COUNTDOWN_SECONDS - elapsed);
    return <CountdownOverlay value={remaining} />;
  }

  if (state.phase === "leaderboard") {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <Leaderboard
          key={`lb-${state.currentQuestionIndex}-${state.version}`}
          players={state.leaderboard}
          title="Top 5"
          highlightId={playerId ?? undefined}
          startScores={startScores}
        />
        {myRank && myRank.rank! > 5 && (
          <p className="rounded-xl bg-white/10 px-6 py-3 font-bold text-white">
            Your rank: #{myRank.rank} —{" "}
            <AnimatedScore
              from={startScores[myRank.id] ?? myRank.score}
              to={myRank.score}
              duration={900}
              delay={2800}
            />{" "}
            pts
          </p>
        )}
      </div>
    );
  }

  const question = state.currentQuestion;
  if (!question) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white/70">
        Waiting for next question…
      </div>
    );
  }

  const timeLeft = state.questionStartedAt
    ? Math.max(0, Math.ceil(question.timeLimit - (now - state.questionStartedAt) / 1000))
    : question.timeLimit;

  const isReveal = state.phase === "reveal";
  const answered = !!selectedOption;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-white/60">
          Question {state.currentQuestionIndex + 1} / {state.totalQuestions}
        </p>
        <RtlText
          as="h2"
          text={question.text}
          align="center"
          className="mt-2 text-2xl font-black text-white md:text-3xl"
        />
        {myRank && (
          <p className="mt-2 text-sm font-bold text-yellow-300">
            Score:{" "}
            {(state.phase === "reveal"
              ? (questionStartScores[myRank.id] ?? myRank.score)
              : myRank.score
            ).toLocaleString()}
          </p>
        )}
      </div>

      {!isReveal && !answered && state.questionStartedAt && (
        <TimerBar seconds={timeLeft} total={question.timeLimit} />
      )}

      {answered && !isReveal && (
        <div className="rounded-xl bg-white/10 py-4 text-center font-bold text-white">
          Answer locked in!
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shuffledOptions.map((opt, i) => {
          const originalIndex = question.options.findIndex((o) => o.id === opt.id);
          const isCorrect = state.revealCorrectId === opt.id;
          const isWrong = isReveal && selectedOption === opt.id && !isCorrect;

          return (
            <AnswerButton
              key={opt.id}
              text={opt.text}
              index={originalIndex}
              selected={selectedOption === opt.id}
              correct={isReveal && isCorrect}
              wrong={isWrong}
              disabled={answered || isReveal || timeLeft === 0}
              showResult={isReveal}
              onClick={() => submitAnswer(opt.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
