"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";
import pairs from "@/data/memory/pairs.json";
import { DEFAULT_SETTINGS, loadSettings } from "@/lib/settings";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { AgeTier, GameStats, GameStatsByTier, GeekJrSettings } from "@/lib/types";

const STORAGE_KEY = "geekjr_stats_memory_v2";
type Pair = { id: string; tier: AgeTier; label: string; visual: string };
type Tile = Pair & { tileId: string };
const EMPTY: GameStats = { totalAttempts: 0, correctCount: 0, bestStreak: 0 };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeTiles(settings: GeekJrSettings): Tile[] {
  const pool = (pairs as Pair[]).filter((pair) => pair.tier === settings.ageTier);
  const selected = shuffle(pool).slice(0, Math.min(settings.ageTier === "1-2" ? 2 : settings.sessionSize, pool.length));
  return shuffle(selected.flatMap((pair) => [
    { ...pair, tileId: `${pair.id}-a` },
    { ...pair, tileId: `${pair.id}-b` },
  ]));
}

export default function MemoryGame() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_SETTINGS.timeLimitSec);
  const [roundAttempts, setRoundAttempts] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundBest, setRoundBest] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [ended, setEnded] = useState(false);
  const lockRef = useRef(false);
  const firstRef = useRef<Tile | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsRef = useRef<GameStatsByTier | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const loaded = loadSettings();
      setSettings(loaded);
      setTiles(makeTiles(loaded));
      setSecondsLeft(loaded.timeLimitSec);
      statsRef.current = loadFromStorage<GameStatsByTier>(STORAGE_KEY, {
        "1-2": { ...EMPTY }, "3-4": { ...EMPTY },
        "5-7": { ...EMPTY }, "8-10": { ...EMPTY },
      });
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
  }, []);

  useEffect(() => {
    if (!hydrated || ended || settings.ageTier === "1-2" || settings.timeLimitSec === 0) return;
    const timer = window.setInterval(() => setSecondsLeft((current) => {
      if (current <= 1) {
        window.clearInterval(timer);
        setEnded(true);
        return 0;
      }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [hydrated, ended, settings.ageTier, settings.timeLimitSec]);

  function recordAttempt(correct: boolean, nextStreak: number) {
    const previous = statsRef.current;
    if (!previous) return;
    const current = previous[settings.ageTier] ?? EMPTY;
    const next = {
      ...previous,
      [settings.ageTier]: {
        totalAttempts: current.totalAttempts + 1,
        correctCount: current.correctCount + (correct ? 1 : 0),
        bestStreak: Math.max(current.bestStreak, nextStreak),
      },
    };
    statsRef.current = next;
    saveToStorage(STORAGE_KEY, next);
  }

  function flip(tile: Tile) {
    if (ended || lockRef.current || flipped.includes(tile.tileId) || matched.includes(tile.id)) return;

    const first = firstRef.current;
    if (!first) {
      firstRef.current = tile;
      setFlipped([tile.tileId]);
      return;
    }

    lockRef.current = true;
    setFlipped([first.tileId, tile.tileId]);
    const correct = first.id === tile.id;
    const nextStreak = correct ? streak + 1 : 0;
    setRoundAttempts((count) => count + 1);
    setStreak(nextStreak);
    setRoundBest((best) => Math.max(best, nextStreak));
    recordAttempt(correct, nextStreak);

    if (correct) {
      setRoundCorrect((count) => count + 1);
      const nextMatched = [...matched, tile.id];
      setMatched(nextMatched);
      if (nextMatched.length === tiles.length / 2) setEnded(true);
      firstRef.current = null;
      lockRef.current = false;
      setFlipped([]);
    } else {
      hideTimeout.current = setTimeout(() => {
        firstRef.current = null;
        setFlipped([]);
        lockRef.current = false;
      }, 900);
    }
  }

  function playAgain() {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    firstRef.current = null;
    lockRef.current = false;
    setTiles(makeTiles(settings));
    setFlipped([]);
    setMatched([]);
    setRoundAttempts(0);
    setRoundCorrect(0);
    setStreak(0);
    setRoundBest(0);
    setSecondsLeft(settings.timeLimitSec);
    setEnded(false);
  }

  if (!hydrated) return <p className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-slate-700">Loading memory game...</p>;

  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold text-slate-900">Memory Match</h1>
      <p className="mt-2 text-slate-600">{settings.ageTier === "1-2" ? "Look together. Tap two pictures that are the same. All pictures stay visible." : "Flip two cards. Find every matching pair."}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
        <span className="rounded-lg bg-slate-100 px-3 py-2">Pairs: {matched.length}/{tiles.length / 2}</span>
        <span className="rounded-lg bg-slate-100 px-3 py-2">{settings.ageTier === "1-2" || settings.timeLimitSec === 0 ? "Take your time" : `Time: ${secondsLeft}s`}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Memory cards">
        {tiles.map((tile, index) => {
          const visible = settings.ageTier === "1-2" || flipped.includes(tile.tileId) || matched.includes(tile.id);
          return (
            <button
              key={tile.tileId}
              type="button"
              onClick={() => flip(tile)}
              disabled={ended || matched.includes(tile.id)}
              aria-label={visible ? tile.label : `Hidden card ${index + 1}`}
              className={`flex min-h-28 flex-col items-center justify-center rounded-xl border-2 p-3 text-slate-900 transition focus-visible:outline-4 focus-visible:outline-teal-500 ${matched.includes(tile.id) ? "border-emerald-500 bg-emerald-50" : flipped.includes(tile.tileId) ? "border-teal-700 bg-teal-100 ring-2 ring-teal-700" : visible ? "border-teal-200 bg-teal-50" : "border-slate-300 bg-slate-100 hover:bg-slate-200"}`}
            >
              {visible ? <><span className="text-4xl" aria-hidden="true">{tile.visual}</span><span className="mt-1 font-semibold">{tile.label}</span></> : <span className="text-3xl" aria-hidden="true">?</span>}
            </button>
          );
        })}
      </div>

      {ended && (
        <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-emerald-900" role="status">
          <h2 className="text-xl font-bold">{matched.length === tiles.length / 2 ? "All pairs found!" : "Time is up"}</h2>
          <p className="mt-2">This round: {roundCorrect} pairs in {roundAttempts} tries</p>
          <p>Best streak this round: {roundBest}</p>
          <button type="button" onClick={playAgain} className="mt-4 rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800">Play again</button><Link href="/" className="jr-end-home">Back to play</Link>
        </div>
      )}
    </section>
  );
}
