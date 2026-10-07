"use client";

import Link from "next/link";
import AudioIcon from "@/modules/common/AudioIcon";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, loadSettings } from "@/lib/settings";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { AgeTier, GameStats, GameStatsByTier } from "@/lib/types";
import { prepareChoiceRound } from "@/lib/practice";

export interface ChoicePrompt {
  id: string;
  tier: AgeTier;
  prompt: string;
  choices: string[];
  correct: string;
  pack?: "christian";
}

interface TimedChoicesGameProps {
  title: string;
  storageKey: string;
  prompts: ChoicePrompt[];
}

const EMPTY_STATS: GameStats = {
  totalAttempts: 0,
  correctCount: 0,
  bestStreak: 0,
};

const EMPTY_BY_TIER: GameStatsByTier = {
  "1-2": { ...EMPTY_STATS },
  "3-4": { ...EMPTY_STATS },
  "5-7": { ...EMPTY_STATS },
  "8-10": { ...EMPTY_STATS },
};

export default function TimedChoicesGame({ title, storageKey, prompts }: TimedChoicesGameProps) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [sessionPrompts, setSessionPrompts] = useState<ChoicePrompt[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_SETTINGS.timeLimitSec);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [triedChoices, setTriedChoices] = useState<string[]>([]);
  const lockedRef = useRef(false);
  const triedRef = useRef(new Set<string>());
  const advanceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ended, setEnded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState<GameStatsByTier>(EMPTY_BY_TIER);
  const [roundAttempts, setRoundAttempts] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundBestStreak, setRoundBestStreak] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const firstTryRef = useRef(0);

  useEffect(() => {
    const loadedSettings = loadSettings();
    const pool = prompts.filter((p) =>
      p.tier === loadedSettings.ageTier && (p.pack !== "christian" || loadedSettings.christianPacks));
    const preparedPrompts = prepareChoiceRound(pool, loadedSettings.sessionSize);

    setSettings(loadedSettings);
    setSessionPrompts(preparedPrompts);
    setSecondsLeft(loadedSettings.timeLimitSec);
    setHydrated(true);
  }, [prompts]);

  useEffect(() => {
    setStats(loadFromStorage<GameStatsByTier>(storageKey, EMPTY_BY_TIER));
  }, [storageKey]);

  useEffect(() => () => {
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
  }, []);

  useEffect(() => {
    if (!hydrated || ended || settings.ageTier === "1-2" || settings.timeLimitSec === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [ended, hydrated, settings.ageTier, settings.timeLimitSec]);

  const current = sessionPrompts[index];

  useEffect(() => {
    if (!ended && index >= sessionPrompts.length && sessionPrompts.length > 0) {
      setEnded(true);
    }
  }, [ended, index, sessionPrompts.length]);

  function updateStats(wasCorrect: boolean, nextStreak: number) {
    setStats((prev) => {
      const tier = settings.ageTier;
      const currentTier = prev[tier] ?? { ...EMPTY_STATS };
      const updatedTier: GameStats = {
        totalAttempts: currentTier.totalAttempts + 1,
        correctCount: currentTier.correctCount + (wasCorrect ? 1 : 0),
        bestStreak: Math.max(currentTier.bestStreak, nextStreak),
      };
      const updated = {
        ...prev,
        [tier]: updatedTier,
      };
      saveToStorage(storageKey, updated);
      return updated;
    });
  }

  function handleChoice(choice: string) {
    if (!current || ended || lockedRef.current || triedRef.current.has(choice)) {
      return;
    }

    const isFirstTry = triedRef.current.size === 0;
    triedRef.current.add(choice);
    setTriedChoices([...triedRef.current]);

    const wasCorrect = choice === current.correct;
    if (isFirstTry && wasCorrect) {
      firstTryRef.current += 1;
      setFirstTryCorrect(firstTryRef.current);
    }
    const nextStreak = wasCorrect ? streak + 1 : 0;

    setStreak(nextStreak);
    setFeedback(wasCorrect ? "Correct!" : "Try another one.");
    setRoundAttempts((prev) => prev + 1);
    if (wasCorrect) setRoundCorrect((prev) => prev + 1);
    setRoundBestStreak((prev) => Math.max(prev, nextStreak));
    updateStats(wasCorrect, nextStreak);

    if (wasCorrect) {
      lockedRef.current = true;
      advanceTimeout.current = setTimeout(() => {
        lockedRef.current = false;
        triedRef.current = new Set();
        setTriedChoices([]);
        setFeedback("");
        setIndex((prev) => prev + 1);
      }, 350);
    }
  }

  function restart() {
    window.location.reload();
  }

  function readText(value: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(value));
  }

  if (!hydrated) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-4 text-sm text-slate-600">Loading your session...</p>
      </section>
    );
  }

  if (!sessionPrompts.length) {
    return <p className="rounded-xl bg-amber-100 p-4 text-amber-900">No prompts found for this activity.</p>;
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">One little question at a time.</p>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-lg bg-slate-100 p-2">{settings.ageTier === "1-2" || settings.timeLimitSec === 0 ? "No timer" : `Timer: ${secondsLeft}s`}</div>
        <div className="rounded-lg bg-slate-100 p-2">Question {Math.min(index + 1, sessionPrompts.length)} of {sessionPrompts.length}</div>
        <div className="rounded-lg bg-slate-100 p-2">Streak: {streak}</div>
      </div>

      {!ended && current ? (
        <>
          <div className="mt-6 rounded-xl bg-teal-50 p-4 text-center text-lg font-semibold text-teal-950">
            {current.prompt}
            <button type="button" onClick={() => readText(current.prompt)} className="mt-3 block w-full rounded-lg bg-teal-900 px-4 py-3 text-base text-white hover:bg-teal-800">
              <AudioIcon /> Hear the question
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {current.choices.map((choice) => (
              <div key={`${current.id}-${choice}`} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChoice(choice)}
                  disabled={triedChoices.includes(choice)}
                  className="min-h-14 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-lg font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {choice}
                </button>
                <button type="button" aria-label={`Hear ${choice}`} onClick={() => readText(choice)} className="min-w-14 rounded-xl border border-teal-200 bg-teal-50 text-lg hover:bg-teal-100"><AudioIcon /></button>
              </div>
            ))}
          </div>
          <p className="mt-4 min-h-6 text-sm font-semibold text-slate-700" role="status">{feedback}</p>
        </>
      ) : (
        <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-emerald-900">
          <h2 className="text-xl font-bold">Lovely trying!</h2>
          <p className="mt-2">You gave it a go. Try another round, or take a little break.</p>
          <details className="jr-disclosure"><summary><span><b>Grown-up: round summary</b><small>Answers and practice totals.</small></span></summary><div className="jr-options-content">          <p className="mt-2">This round: {roundCorrect} correct in {roundAttempts} attempts</p>
          <p>Correct on the first try: {firstTryCorrect} of {sessionPrompts.length} questions</p>
          <p className="mt-2 text-sm">These are practice results. Revisit the skill with a different example to check understanding.</p>
          <p>Best streak this round: {roundBestStreak}</p>
          <p className="mt-2 text-sm">All-time correct: {stats[settings.ageTier]?.correctCount ?? 0}</p>
</div></details>
          <button
            type="button"
            onClick={restart}
            className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
          >
            Play again
          </button>
          <Link href="/" className="jr-end-home">Back to play</Link>
        </div>
      )}
    </section>
  );
}
