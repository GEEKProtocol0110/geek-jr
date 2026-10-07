"use client";

import TimedChoicesGame from "@/modules/common/TimedChoicesGame";
import { ChoicePrompt } from "@/modules/common/TimedChoicesGame";
import prompts from "@/data/phonics/sounds.json";
import { useState } from "react";
import ReadingPath from "@/modules/phonics/ReadingPath";

export default function PhonicsGame() {
  const [practice, setPractice] = useState(false);
  return <div className="grid gap-6">
    <ReadingPath />
    <details className="jr-disclosure"><summary><span><b>More letter &amp; word practice</b><small>An optional quiz to try together.</small></span></summary><div className="jr-options-content">
      <h2 className="font-bold text-slate-950">More letter & word practice</h2>
      <p className="mt-2 text-sm text-slate-600">Optional age-level quiz. Spoken prompts use your device voice; they are not models of individual speech sounds. Quiz taps do not count as reading-path observations.</p>
      <button className="mt-3 min-h-12 rounded-lg border border-slate-400 px-4 py-3 font-bold" aria-expanded={practice} onClick={() => setPractice(!practice)}>{practice ? "Hide quiz" : "Open practice quiz"}</button>
    </div></details>
    {practice && (
    <TimedChoicesGame
      title="Letter & word practice"
      storageKey="geekjr_stats_phonics_v1"
      prompts={prompts as ChoicePrompt[]}
    />
    )}
  </div>;
}
