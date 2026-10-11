import type { AgeTier } from "./types";

export type CountingPrompt = { id: string; left: number; right: number; operation: "count" | "add" | "take"; answer: number; choices: number[] };
const limits: Record<AgeTier, number> = { "1-2": 3, "3-4": 5, "5-7": 10, "8-10": 10 };
function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
export function countingRound(age: AgeTier, size: number, random = Math.random): CountingPrompt[] {
  const max = limits[age];
  const pool: Omit<CountingPrompt, "choices">[] = Array.from({ length: max }, (_, i) => ({ id: `count-${i + 1}`, left: i + 1, right: 0, operation: "count", answer: i + 1 }));
  if (age === "8-10") {
    for (let left = 2; left <= 8; left++) {
      const right = Math.min(4, left - 1);
      pool.push({ id: `add-${left}-${right}`, left, right, operation: "add", answer: left + right });
      pool.push({ id: `take-${left}-${right}`, left, right, operation: "take", answer: left - right });
    }
  }
  return shuffle(pool, random).slice(0, Math.max(1, Math.min(10, size))).map(item => {
    const range = age === "8-10" ? 12 : max;
    const others = shuffle(Array.from({ length: range + 1 }, (_, i) => i).filter(n => n !== item.answer), random).slice(0, 2);
    return { ...item, choices: shuffle([item.answer, ...others], random) };
  });
}
