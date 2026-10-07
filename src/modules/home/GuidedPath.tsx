"use client";

import Link from "next/link";
import ActivityIcon from "@/modules/common/ActivityIcon";
import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "@/lib/settings";
import { AgeTier, GeekJrSettings } from "@/lib/types";
import { FIRST_WORDS_KEY, WordCardProgress } from "@/lib/firstWords";
import { loadFromStorage } from "@/lib/storage";
import { WORD_LESSONS } from "@/lib/wordLessons";

const ages: AgeTier[] = ["1-2", "3-4", "5-7", "8-10"];
const paths: Record<AgeTier, { href: string; title: string; focus: string }[]> = {
  "1-2": [
    { href: "/first-words", title: "First Words", focus: "Look, say and play together." },
    { href: "/cards", title: "Picture Cards", focus: "Name what you see." },
    { href: "/memory", title: "Picture matching", focus: "Find two pictures that match." },
  ],
  "3-4": [
    { href: "/first-words", title: "First Words", focus: "Explore a few familiar words." },
    { href: "/phonics", title: "Reading Path", focus: "Play with sounds; try letters when ready." },
    { href: "/memory", title: "Memory Match", focus: "Flip a card. Find a pair." },
  ],
  "5-7": [
    { href: "/phonics", title: "Reading Path", focus: "Blend, build and read together." },
    { href: "/patterns", title: "Patterns & Logic", focus: "Spot what comes next." },
    { href: "/stories", title: "Story Sequence", focus: "Find the next part of the story." },
  ],
  "8-10": [
    { href: "/patterns", title: "Patterns & Logic", focus: "Try a little thinking puzzle." },
    { href: "/stories", title: "Story Sequence", focus: "Think about what happens next." },
    { href: "/memory", title: "Memory Match", focus: "Remember a card. Find its pair." },
  ],
};

export default function GuidedPath() {
  const [settings, setSettings] = useState<GeekJrSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [wordProgress, setWordProgress] = useState<Record<string, WordCardProgress>>({});
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSettings(loadSettings());
      setWordProgress(loadFromStorage<Record<string, WordCardProgress>>(FIRST_WORDS_KEY, {}));
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  function chooseAge(ageTier: AgeTier) {
    const next = { ...settings, ageTier };
    setSettings(next);
    saveSettings(next);
  }
  const suggestedLesson = WORD_LESSONS.find((lesson) => lesson.words.some((id) => wordProgress[id]?.observations?.understands?.level !== "independent")) ?? [...WORD_LESSONS].sort((a, b) => Math.min(...a.words.map((id) => wordProgress[id]?.lastSeen ?? 0)) - Math.min(...b.words.map((id) => wordProgress[id]?.lastSeen ?? 0)))[0];
  const path = paths[settings.ageTier];
  const first = path[0];
  const wordLesson = settings.ageTier === "1-2" || settings.ageTier === "3-4";
  return (
    <section className="guided-section" id="start" aria-labelledby="guided-title">
      <div className="guided-inner">
        <div className="guided-intro"><p className="eyebrow">One small step</p><h2 id="guided-title">Let’s start here.</h2><p>Pick one thing. Play together. Come back whenever you like.</p></div>
        <div className="guided-content">
          <details className="jr-disclosure learning-level">
            <summary><span><b>Grown-up: choose a learning level</b><small>Ages {settings.ageTier.replace("-", "–")} · change anytime</small></span></summary>
            <div className="age-picker" role="group" aria-label="Choose an age level">
              <div>{ages.map((age) => <button key={age} type="button" aria-pressed={settings.ageTier === age} onClick={() => chooseAge(age)}>{age.replace("-", "–")}</button>)}</div>
              <p>Follow your child’s readiness. These are starting suggestions.</p>
              <Link href="/parent">Round length & more settings →</Link>
            </div>
          </details>
          {ready ? <article className="jr-recommendation">
            <span className="recommendation-icon" aria-hidden="true"><ActivityIcon href={first.href} /></span>
            <div><span className="recommendation-label">A little activity to try</span><h3>{wordLesson ? suggestedLesson.title : first.title}</h3><p>{wordLesson ? suggestedLesson.description : first.focus}</p><Link className="hero-primary" href={wordLesson ? `/first-words?lesson=${suggestedLesson.id}` : first.href}>Start {first.title} <span aria-hidden="true">→</span></Link><small>With a grown-up. No need to finish in one sitting.</small></div>
          </article> : <p className="jr-loading" role="status">Finding a little activity…</p>}
          <details className="jr-disclosure other-paths"><summary><span><b>Try something else</b><small>Two more ideas for this level.</small></span></summary><div className="guided-steps">{path.slice(1).map((item) => <Link key={item.href} href={item.href} className="guided-step"><span className="step-icon" aria-hidden="true"><ActivityIcon href={item.href} /></span><span className="step-copy"><strong>{item.title}</strong><small>{item.focus}</small></span><span className="step-arrow" aria-hidden="true">→</span></Link>)}</div></details>
        </div>
      </div>
    </section>
  );
}
