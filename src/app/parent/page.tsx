"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "@/lib/settings";
import { loadFromStorage } from "@/lib/storage";
import { FIRST_WORDS_KEY, OBSERVATION_LEVELS, WORD_SKILLS, WordCardProgress } from "@/lib/firstWords";
import words from "@/data/decks/first-words.json";
import { cleanReadingProgress, READING_KEY, READING_LESSONS, READING_SKILLS, ReadingProgress } from "@/lib/reading";
import { AgeTier, GameStatsByTier, GeekJrSettings, SessionSize, TimeLimitSec } from "@/lib/types";

const AGE_TIERS: AgeTier[] = ["1-2", "3-4", "5-7", "8-10"];
const SESSION_SIZES: SessionSize[] = [3, 5, 10];
const TIME_LIMITS: TimeLimitSec[] = [0, 60, 120, 180];

const GAME_KEYS = [
  { id: "phonics", label: "Letter & word quiz", key: "geekjr_stats_phonics_v1" },
  { id: "memory", label: "Memory Match", key: "geekjr_stats_memory_v2" },
  { id: "patterns", label: "Patterns & Logic", key: "geekjr_stats_patterns_v1" },
  { id: "stories", label: "Story Sequence", key: "geekjr_stats_stories_v1" },
];

const EMPTY = { totalAttempts: 0, correctCount: 0, bestStreak: 0 };

function statsSummary(statsByTier: GameStatsByTier) {
  return AGE_TIERS.reduce(
    (acc, tier) => {
      const tierStats = statsByTier[tier] ?? EMPTY;
      return {
        totalAttempts: acc.totalAttempts + tierStats.totalAttempts,
        correctCount: acc.correctCount + tierStats.correctCount,
        bestStreak: Math.max(acc.bestStreak, tierStats.bestStreak),
      };
    },
    { totalAttempts: 0, correctCount: 0, bestStreak: 0 },
  );
}

export default function ParentPage() {
  const [settings, setSettings] = useState<GeekJrSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Record<string, ReturnType<typeof statsSummary>>>({});
  const [practicedCards, setPracticedCards] = useState(0);
  const [practicedWords, setPracticedWords] = useState(0);
  const [wordProgress, setWordProgress] = useState<Record<string, WordCardProgress>>({});
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({});

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSettings(loadSettings());
      setReadingProgress(cleanReadingProgress(loadFromStorage<unknown>(READING_KEY, {})));
      setPracticedCards(Object.keys(loadFromStorage<Record<string, 1 | 2 | 3>>("geekjr_cards_leitner_v1", {})).length);
      const savedWords = loadFromStorage<Record<string, WordCardProgress>>(FIRST_WORDS_KEY, {});
      setWordProgress(savedWords);
      setPracticedWords(Object.values(savedWords).filter((word) => word.seenCount > 0).length);
      setStats(Object.fromEntries(GAME_KEYS.map((game) => {
        const raw = loadFromStorage<GameStatsByTier>(game.key, {
          "1-2": EMPTY, "3-4": EMPTY, "5-7": EMPTY, "8-10": EMPTY,
        });
        return [game.id, statsSummary(raw)];
      })));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function update<K extends keyof GeekJrSettings>(key: K, value: GeekJrSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  }

  return (
    <main id="main-content" className="activity-page">
      <section className="jr-parent">
        <div className="jr-parent-heading">
          <h1 className="text-3xl font-black text-slate-900">For grown-ups</h1>
          <Link href="/#activities" className="back-link">
            <span aria-hidden="true">←</span> All activities
          </Link>
        </div>
        <p className="jr-parent-intro">Make play fit your day. Choose a starting level and a short round. Settings and progress stay in this browser.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Round length
            <select
              value={settings.sessionSize}
              onChange={(e) => update("sessionSize", Number(e.target.value) as SessionSize)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {SESSION_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} questions / cards
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Learning level
            <select
              value={settings.ageTier}
              onChange={(e) => update("ageTier", e.target.value as AgeTier)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {AGE_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </label>

        </div>
        <details className="jr-disclosure"><summary><span><b>More preferences</b><small>Optional timer and Bible story questions.</small></span></summary><div className="jr-parent-panel grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Optional timer
            <select
              value={settings.timeLimitSec}
              onChange={(e) => update("timeLimitSec", Number(e.target.value) as TimeLimitSec)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {TIME_LIMITS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec === 0 ? "No timer" : `${sec / 60} minute${sec === 60 ? "" : "s"}`}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-slate-500">Ages 1–2 always play without a timer.</span>
          </label>

          <label className="flex items-center gap-3 self-end rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={settings.christianPacks}
              onChange={(e) => update("christianPacks", e.target.checked)}
              className="size-4"
            />
            Include Bible story questions
          </label>
        </div></details>
        <Link href="/#start" className="hero-primary mt-3">Ready? Let’s play <span aria-hidden="true">→</span></Link>
        <h2 className="mt-8 text-xl font-bold text-slate-900">Your time together</h2>
        <div className="jr-parent-summary"><div><strong>{practicedCards}</strong><span>Picture cards practiced</span></div><div><strong>{practicedWords}</strong><span>First words practiced</span></div></div>
        <details className="jr-disclosure" id="word-observations"><summary><span><b>Word observations</b><small>Understanding, talking and familiar print.</small></span></summary><div className="jr-parent-panel">
      <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
          <h3 className="text-lg font-bold text-teal-950">What you have observed</h3>
          <p className="mt-2 text-sm text-teal-900">Understanding, talking, and recognizing print are separate skills. Old ‘Got it’ marks stay in your practice history; they do not count as observations here.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {WORD_SKILLS.map((skill) => {
              const observed = Object.values(wordProgress).flatMap((word) => word.observations?.[skill.id] ? [word.observations[skill.id]!] : []);
              return <div key={skill.id} className="rounded-lg bg-white p-3">
                <p className="text-sm font-bold text-slate-900">{skill.label}</p>
                <p className="mt-1 text-xl font-black text-teal-900">{observed.filter((item) => item.level === "independent").length} <span className="text-xs font-normal">on their own</span></p>
                <p className="mt-1 text-xs text-slate-600">{observed.filter((item) => item.level === "with-help").length} with help · {observed.filter((item) => item.level === "not-yet").length} not yet</p>
              </div>;
            })}
          </div>
          {Object.values(wordProgress).some((word) => word.observations && Object.keys(word.observations).length > 0) ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="mb-2 text-left font-bold text-teal-950">Most recent word observations</caption>
                <thead><tr><th className="p-2">Word</th>{WORD_SKILLS.map((skill) => <th key={skill.id} className="p-2">{skill.id === "understands" ? "Understands" : skill.id === "speaks" ? "Says / attempts" : "Print"}</th>)}</tr></thead>
                <tbody>{words.filter((word) => wordProgress[word.id]?.observations && Object.keys(wordProgress[word.id].observations!).length > 0).sort((a, b) => wordProgress[b.id].lastSeen - wordProgress[a.id].lastSeen).slice(0, 10).map((word) => (
                  <tr key={word.id} className="border-t border-teal-200"><th scope="row" className="p-2"><Link href={`/first-words?word=${encodeURIComponent(word.id)}`} className="font-bold underline">{word.word}</Link></th>{WORD_SKILLS.map((skill) => {
                    const observation = wordProgress[word.id].observations?.[skill.id];
                    return <td key={skill.id} className="whitespace-nowrap p-2">{observation ? <>{OBSERVATION_LEVELS.find((level) => level.id === observation.level)?.label}<span className="block text-xs text-slate-500">{new Date(observation.lastObserved).toLocaleDateString()}</span></> : "Not observed"}</td>;
                  })}</tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="mt-4 text-sm text-teal-900">Start a First Words lesson and record only the skills you observe.</p>}
          <Link href="/first-words" className="mt-4 inline-block min-h-12 rounded-lg bg-teal-800 px-4 py-3 font-bold text-white">Practice First Words</Link>
          <p className="mt-3 text-xs text-teal-900">These observations describe familiar words. Print recognition does not demonstrate decoding unfamiliar words. All progress stays in this browser; clearing site data removes it.</p>
        </div>
        </div></details>
        <details className="jr-disclosure" id="reading-observations"><summary><span><b>Reading observations</b><small>Sounds, blending, spelling and understanding.</small></span></summary><div className="jr-parent-panel">
      <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4">
          <h3 className="text-lg font-bold text-slate-950">Reading Path observations</h3>
          <p className="mt-2 text-sm text-slate-700">Sound knowledge, blending a new word, spelling, and reading with understanding are recorded separately. These are parent observations, not quiz scores or a reading-age assessment.</p>
          {Object.keys(readingProgress).length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm">
            <caption className="mb-2 text-left font-bold">Latest reading observations</caption>
            <thead><tr><th className="p-2">Lesson</th>{READING_SKILLS.map((skill) => <th key={skill.id} className="p-2">{skill.label}</th>)}</tr></thead>
            <tbody>{READING_LESSONS.filter((lesson) => readingProgress[lesson.id]).map((lesson) => <tr key={lesson.id} className="border-t border-sky-200">
              <th scope="row" className="p-2"><Link className="underline" href={`/phonics?lesson=${lesson.id}`}>{lesson.title}</Link></th>
              {READING_SKILLS.map((skill) => { const observation = readingProgress[lesson.id][skill.id]; return <td key={skill.id} className="p-2">{observation ? <>{observation.level === "independent" ? "On their own" : observation.level === "with-help" ? "With help" : "Not yet"}<span className="block text-xs text-slate-500">{new Date(observation.date).toLocaleDateString()} · {observation.independentDays.length} independent day{observation.independentDays.length === 1 ? "" : "s"}</span></> : "Not observed"}</td>; })}
            </tr>)}</tbody>
          </table></div> : <p className="mt-4 text-sm text-slate-700">No reading observations yet. Begin with listening and talking, then try letters when ready.</p>}
          <Link href="/phonics" className="mt-4 inline-block min-h-12 rounded-lg bg-teal-800 px-4 py-3 font-bold text-white">Open Reading Path</Link>
          <p className="mt-3 text-xs text-slate-600">Review suggestions require independent observations on two different days for each skill. Needing help resets that skill’s review count. This is a practice rule, not proof of mastery. Records stay on this device and are not separate child profiles.</p>
        </div>
        </div></details>
        <details className="jr-disclosure"><summary><span><b>Game practice</b><small>Rounds, answers and recent practice totals.</small></span></summary><div className="jr-parent-panel">
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GAME_KEYS.map((game) => {
            const summary = stats[game.id] ?? EMPTY;

            return (
              <article key={game.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">{game.label}</h3>
                <p className="text-sm text-slate-700">Attempts: {summary.totalAttempts}</p>
                <p className="text-sm text-slate-700">Correct: {summary.correctCount}</p>
                <p className="text-sm text-slate-700">Best streak: {summary.bestStreak}</p>
              </article>
            );
          })}
        </div>
        </div></details>
      </section>
    </main>
  );
}
