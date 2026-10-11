"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { countingRound, CountingPrompt } from "@/lib/counting";
import { DEFAULT_SETTINGS, loadSettings } from "@/lib/settings";
const button = "min-h-14 rounded-xl border-2 border-teal-700 px-5 py-3 font-bold focus-visible:outline-4 focus-visible:outline-amber-500";

export default function CountingGarden() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [round, setRound] = useState<CountingPrompt[]>([]);
  const [index, setIndex] = useState(0);
  const [touched, setTouched] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");
  const [solved, setSolved] = useState(false);
  const [tried, setTried] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const answerLock = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = loadSettings(); setSettings(saved); setRound(countingRound(saved.ageTier, saved.sessionSize));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const question = round[index];
  function answer(value: number) {
    if (!question || answerLock.current) return;
    if (value === question.answer) {
      answerLock.current = true; setSolved(true); if (!tried) setFirstTry(n => n + 1);
      setFeedback(`${value}! ${question.operation === "take" ? "That is how many are left." : "That is how many altogether."}`);
    } else { setTried(true); setFeedback("Let’s touch each flower once and count together. Try another number."); }
  }
  function next() {
    if (!answerLock.current) return;
    setIndex(n => n + 1); setTouched([]); setFeedback(""); setSolved(false); setTried(false); answerLock.current = false;
    requestAnimationFrame(() => title.current?.focus());
  }
  function restart() {
    setRound(countingRound(settings.ageTier, settings.sessionSize)); setIndex(0); setTouched([]); setFeedback(""); setSolved(false); setTried(false); setFirstTry(0); answerLock.current = false;
  }
  if (!round.length) return <p role="status">Finding flowers to count…</p>;
  if (!question) return <section className="rounded-3xl bg-white p-6 shadow-lg"><h1 ref={title} tabIndex={-1} className="text-3xl font-bold text-teal-950">A little garden, well explored.</h1><p className="mt-4 text-slate-700">You finished {round.length} counting activities. {firstTry} answered on the first try. Help and retries are part of learning.</p><p className="mt-4 rounded-xl bg-amber-50 p-4 text-slate-800">Try it away from the screen: put a few toys in a row. Touch each one as you count. Rearrange them—does the number change?</p><div className="mt-5 flex flex-wrap gap-3"><button className={button} onClick={restart}>Another little garden</button><Link className={button} href="/memory">Try number matching →</Link><Link className={button} href="/">Back to play</Link></div></section>;
  const total = question.left + (question.operation === "add" ? question.right : 0);
  return <section className="rounded-3xl bg-white p-5 shadow-lg sm:p-8" aria-labelledby="counting-title">
    <p className="text-sm font-bold uppercase tracking-widest text-teal-800">Counting Garden · {index + 1} of {round.length} · No timer</p>
    <h1 id="counting-title" ref={title} tabIndex={-1} className="mt-2 text-3xl font-bold text-teal-950">{question.operation === "count" ? "How many flowers?" : question.operation === "add" ? "Two flower beds. How many altogether?" : `Pick ${question.right} flowers. How many are left?`}</h1>
    <p className="mt-3 text-slate-700">{question.operation === "take" ? "Crossed flowers have been picked. Touch each flower that is still growing." : "Touch each flower once. Say a number as you go."}</p>
    <div className="mt-6 flex flex-wrap gap-3 rounded-2xl bg-emerald-50 p-4" role="group" aria-label="Flowers to count">
      {Array.from({ length: total }, (_, i) => {
        const picked = question.operation === "take" && i >= question.left - question.right;
        const counted = touched.includes(i);
        return <button key={i} type="button" disabled={picked} aria-label={picked ? "Picked flower" : `Flower ${i + 1}`} aria-pressed={counted} onClick={() => setTouched(current => current.includes(i) ? current.filter(n => n !== i) : [...current, i])} className={`relative flex h-16 w-16 items-center justify-center rounded-xl border-2 text-4xl focus-visible:outline-4 focus-visible:outline-amber-500 ${counted ? "border-teal-800 bg-amber-100" : "border-emerald-200 bg-white"} ${picked ? "opacity-40" : ""} ${question.operation === "add" && i >= question.left ? "border-violet-400" : ""}`}><span aria-hidden="true">🌼</span>{picked && <span aria-hidden="true" className="absolute text-5xl text-slate-950">×</span>}{counted && <span aria-hidden="true" className="absolute -right-1 -top-2 rounded-full bg-teal-800 px-2 text-sm text-white">{touched.indexOf(i) + 1}</span>}</button>;
      })}
    </div>
    <p className="mt-3 text-sm text-teal-950" aria-live="polite">{touched.length ? `${touched.length} flowers touched. Say the count together.` : "Ready when you are."}</p>
    {question.operation !== "count" && <p className="mt-3 text-xl font-bold text-slate-900">{question.left} {question.operation === "add" ? "+" : "−"} {question.right} = ?</p>}
    <div className="mt-6 flex flex-wrap gap-3" role="group" aria-label="Choose a number">{question.choices.map(n => <button key={n} className={`${button} min-w-20 text-3xl ${solved && n === question.answer ? "bg-teal-800 text-white" : "bg-white text-teal-950"}`} disabled={solved} onClick={() => answer(n)}>{n}</button>)}</div>
    <p className="mt-4 min-h-12 font-semibold text-teal-900" role="status">{feedback}</p>
    {solved && <button className={`${button} bg-teal-800 text-white`} onClick={next}>{index === round.length - 1 ? "Finish this garden" : "Next little activity →"}</button>}
    <details className="mt-6 rounded-xl bg-amber-50 p-4 text-slate-700"><summary className="min-h-11 cursor-pointer font-bold">Grown-up: a little coaching</summary><p className="mt-2">Point, count, then say how many. The last counting word tells the total. You can move to a smaller age level in grown-up settings. For adding, count both beds; for taking away, count only flowers still growing. Touches and quiz scores are practice, not proof of mastery.</p><Link href="/parent" className="mt-3 inline-block underline">Change learning level & round length</Link></details>
  </section>;
}
