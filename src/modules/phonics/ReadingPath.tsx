"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSettings } from "@/lib/settings";
import { loadFromStorage } from "@/lib/storage";
import { cleanReadingProgress, lessonReady, READING_KEY, READING_LESSONS, READING_SKILLS, recordReading, SOUND_CUES, suggestedReadingLesson, taughtLetters, ReadingLevel, ReadingProgress, ReadingSkill } from "@/lib/reading";

const steps = ["Sounds", "Blend", "Build", "Read", "Observe"];
const levels: { id: ReadingLevel; label: string }[] = [{ id: "not-yet", label: "Not yet" }, { id: "with-help", label: "With help" }, { id: "independent", label: "On their own" }];
const button = "min-h-12 rounded-xl border border-teal-700 px-4 py-3 font-bold text-teal-950 disabled:opacity-40";

export default function ReadingPath() {
  const [loaded, setLoaded] = useState(false);
  const [print, setPrint] = useState(false);
  const [progress, setProgress] = useState<ReadingProgress>({});
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [sound, setSound] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [highlight, setHighlight] = useState(-1);
  const [built, setBuilt] = useState<string[]>([]);
  const [textHelp, setTextHelp] = useState(false);
  const [blendHelp, setBlendHelp] = useState(false);
  const [observations, setObservations] = useState<Partial<Record<ReadingSkill, ReadingLevel>>>({});
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<{ id: string; observations: ReadingProgress[string] } | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = cleanReadingProgress(loadFromStorage<unknown>(READING_KEY, {}));
      setProgress(saved);
      const params = new URLSearchParams(window.location.search);
      const requested = READING_LESSONS.findIndex((lesson) => lesson.id === params.get("lesson"));
      setIndex(requested >= 0 ? requested : Math.max(0, suggestedReadingLesson(saved)));
      setPrint(loadSettings().ageTier !== "1-2");
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function begin(next: number) {
    setIndex(next); setStep(0); setSound(""); setWordIndex(0); setHighlight(-1);
    setBuilt([]); setTextHelp(false); setBlendHelp(false); setObservations({}); setMessage(""); setRemoved(null);
  }

  function save(now: number) {
    const next = recordReading(progress, lesson.id, observations, now);
    setProgress(next);
    try {
      window.localStorage.setItem(READING_KEY, JSON.stringify(next));
      setMessage("Saved on this device. Follow your child’s interest; review on another day before moving on.");
    } catch {
      setMessage("This browser could not save progress. Your observations are available for this visit only.");
    }
  }

  function removeSaved() {
    const next = { ...progress };
    setRemoved({ id: lesson.id, observations: next[lesson.id] });
    delete next[lesson.id];
    setProgress(next); setObservations({});
    try { window.localStorage.setItem(READING_KEY, JSON.stringify(next)); setMessage("Lesson observations removed. You can undo this before leaving the lesson."); }
    catch { setMessage("Removed for this visit only; this browser could not update saved progress."); }
  }

  function undoRemoval() {
    if (!removed) return;
    const next = { ...progress, [removed.id]: removed.observations };
    setProgress(next); setRemoved(null);
    try { window.localStorage.setItem(READING_KEY, JSON.stringify(next)); setMessage("Lesson observations restored."); }
    catch { setMessage("Restored for this visit only; this browser could not update saved progress."); }
  }

  const lesson = READING_LESSONS[index];
  const letters = [...new Set(taughtLetters(index))];
  const word = lesson.words[wordIndex];
  const suggested = suggestedReadingLesson(progress);

  if (!loaded) return <p role="status">Preparing your reading path…</p>;

  return <section className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200 sm:p-7" aria-labelledby="reading-title">
    <p className="text-xs font-bold tracking-widest text-teal-700">Learning, together</p>
    <h1 id="reading-title" className="mt-2 text-3xl font-black text-slate-950">Let’s read together.</h1>
    <p className="mt-3 text-slate-600">Start with talking and shared books. Try print when your child enjoys sound play and is interested in letters. Readiness leads the way.</p>
    <details className="jr-disclosure jr-options"><summary><span><b>Grown-up: choose a lesson</b><small>{print ? `Letters & words · ${lesson.title}` : "Listen & play"}</small></span></summary><div className="jr-options-content">
      <div className="reading-focus mt-5 flex flex-wrap gap-3" role="group" aria-label="Choose a learning focus">
      <button className={button} aria-pressed={!print} onClick={() => setPrint(false)}>Listen & play</button>
      <button className={button} aria-pressed={print} onClick={() => setPrint(true)}>Letters & words</button>
    </div>

      {print && <>
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-bold text-slate-800">Choose a starter lesson
          <select className="min-h-12 max-w-full rounded-xl border border-slate-300 bg-white px-3" value={index} onChange={(event) => begin(Number(event.target.value))}>
            {READING_LESSONS.map((item, i) => <option key={item.id} value={i}>{i + 1}. {item.title} · {item.letters.split("").join(" ")}</option>)}
          </select>
        </label>
        <button className={button} onClick={() => begin(Math.max(0, suggested))}>Suggested review</button>
      </div>
      <p className="mt-2 text-xs text-slate-600">{suggested < 0 ? "All starter lessons have observations on two days. Revisit a favorite, then continue with a fuller reading program." : `Suggested: lesson ${suggested + 1}. A review suggestion uses observations on two different days, not tap scores.`} Parents can choose any lesson; review earlier sounds first if needed.</p>
      </>}
    </div></details>
    {!print ? <div className="mt-6 rounded-xl bg-amber-50 p-5">
      <h2 className="text-2xl font-bold text-slate-950">A sound adventure, together.</h2>
      <p className="mt-2 text-slate-700">For a one-year-old, begin here: responsive talk, songs, gestures, and real objects. No reading test or timer.</p>
      <ol className="mt-5 grid list-decimal gap-4 pl-5 text-slate-800">
        <li><strong>Listen.</strong> Notice a safe everyday sound: a knock, water pouring, or a bird. Name it and wait for a look or gesture.</li>
        <li><strong>Copy and take turns.</strong> Copy your child’s sound, then add a word: “Ball!” Pause so they can respond.</li>
        <li><strong>Play with words.</strong> Sing a familiar rhyme. If your child enjoys it, stretch a beginning sound in a familiar word: “mmm… milk.” An attempt or a gesture counts as participation.</li>
      </ol>
      <p className="mt-4 text-sm text-slate-600">Stop while it is still fun. Show the real object and share a book away from the screen.</p>
      <Link href="/first-words?lesson=play" className={`${button} mt-5 inline-block`}>Picture words & talking ↗</Link>
    </div> : <>
      <p className="jr-step-marker" role="status">Step {step + 1} of {steps.length} · {steps[step]}</p>
      <details className="jr-disclosure"><summary><span><b>All lesson steps</b><small>Jump to a familiar step.</small></span></summary><div className="jr-options-content">
      <ol className="mt-5 flex flex-wrap gap-2" aria-label="Lesson steps">
        {steps.map((label, i) => <li key={label}><button className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-bold ${step === i ? "border-teal-800 bg-teal-800 text-white" : "border-slate-300 text-slate-700"}`} aria-current={step === i ? "step" : undefined} onClick={() => { setStep(i); setMessage(""); }}>{i + 1}. {label}</button></li>)}
      </ol>
        </div></details>
      <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-800">Lesson {index + 1} / {READING_LESSONS.length} · No timer</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">{lesson.title}</h2>

        {step === 0 && <>
          <p className="mt-3 text-slate-700">Parent: model each new sound, then let your child try. Say the sound rather than the letter name. Brief stop sounds do not need an extra “uh”.</p>
          <div className="mt-5 flex flex-wrap gap-3">{lesson.letters.split("").map((letter) => <button key={letter} aria-label={`Parent cue for ${letter}`} aria-pressed={sound === letter} onClick={() => setSound(letter)} className={`${button} min-w-16 bg-white text-4xl`}>{letter}</button>)}</div>
          <p className="mt-4 min-h-12 text-sm text-teal-950" role="status">{sound ? SOUND_CUES[sound] : "Tap a letter for a parent pronunciation cue. These buttons do not play synthetic phonemes."}</p>
          <p className="mt-3 text-sm text-slate-700">Review sounds already introduced: {index ? taughtLetters(index - 1).split("").join(" · ") : "these first six"}. No need to cover every sound in one sitting.</p>
        </>}
        {step === 1 && <>
          <p className="mt-3 text-slate-700">Point from left to right. Parent: model the sounds close together, blend into the whole word, then let your child try. Letter tiles guide practice; taps do not prove reading.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3" aria-label={`Blend ${word}`}>
            {word.split("").map((letter, i) => <button key={i} aria-label={`Highlight letter ${i + 1}: ${letter}`} aria-pressed={highlight === i} className={`${button} min-w-16 text-5xl ${highlight === i ? "bg-amber-200" : "bg-white"}`} onClick={() => setHighlight(i)}>{letter}</button>)}
          </div>
          {word.includes("x") && <p className="mt-3 text-sm">Remember: x stands for two sounds, /k/ then /s/.</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-2">{lesson.words.map((item, i) => <button className={button} key={item} aria-label={`Practice word ${i + 1}`} aria-pressed={wordIndex === i} onClick={() => { setWordIndex(i); setHighlight(-1); }}>Word {i + 1}</button>)}</div>
          <p className="mt-4 text-sm text-slate-700">After reading, ask what the word means. Use it in conversation or act it out.</p>
        </>}
        {step === 2 && <>
          <p className="mt-3 text-slate-700">Parent: say one practiced word aloud without showing its spelling. Your child says its sounds and builds the word using these letters, or letter cards away from the screen. Help when needed.</p>
          <div className="mt-5 min-h-20 rounded-xl border-2 border-dashed border-teal-600 bg-white p-4 text-center text-4xl tracking-widest" role="status" aria-label="Built word">{built.join("") || "…"}</div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Letters for building">{letters.map((letter) => <button key={letter} className={`${button} min-w-12 bg-white text-xl`} aria-label={`Add ${letter}`} disabled={built.length >= 8} onClick={() => setBuilt([...built, letter])}>{letter}</button>)}</div>
          <div className="mt-3 flex flex-wrap gap-2"><button className={button} disabled={!built.length} onClick={() => setBuilt(built.slice(0, -1))}>Remove last letter</button><button className={button} disabled={!built.length} onClick={() => setBuilt([])}>Clear letters</button></div>
          <p className="mt-3 text-sm text-slate-700">Check together after the attempt. This activity does not automatically score spelling. For x, two sounds share one letter.</p>
        </>}
        {step === 3 && <>
          {index >= 2 && <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700"><strong>Helper word: a.</strong> In these sentences, “a” usually sounds like “uh”, rather than the short a in cat. Teach it separately before reading; it is the only helper word in this starter path.</p>}
          <p className="mt-3 text-slate-700">Try these lines using sounds already introduced. Start each line with a capital letter; a dot ends a sentence. Help first, then try a fresh attempt without prompts.</p>
          <div className="mt-5 rounded-xl bg-white p-5 text-3xl font-bold leading-relaxed text-slate-950 sm:text-4xl" aria-label="Reading text">{lesson.text.map((line) => <p key={line}>{line}</p>)}</div>
          <p className="mt-4 font-bold text-teal-950">Talk about it: {lesson.question}</p>
          <button className={`${button} mt-4`} onClick={() => { setTextHelp(true); setObservations((previous) => ({ ...previous, text: previous.text === "independent" ? undefined : previous.text })); }}>Parent answer & support</button>
          {textHelp && <p className="mt-3 text-sm text-slate-700">{lesson.answer} Read together if needed. Record “with help” when you supplied a word or the answer during this attempt.</p>}
        </>}
        {step === 4 && <>
          <p className="mt-3 text-slate-700">Observe a first attempt without clues. Ask for today’s letter sounds, try the new word below, spell a spoken word without seeing print, and read the lines and explain what happened. Leave anything you did not observe blank.</p>
          <p className="mt-3 text-sm text-slate-700">Sound check: {lesson.letters.split("").join(" · ")}. The word below was not in this lesson’s practice list. If it is already familiar, leave blending unobserved until you can hear a fresh word being decoded.</p>
          <p className="mt-4 rounded-xl bg-white p-5 text-center text-5xl font-bold text-slate-950" aria-label="New blending word">{lesson.checkWord}</p>
          <button className={`${button} mt-3`} onClick={() => { setBlendHelp(true); setObservations((previous) => ({ ...previous, blend: previous.blend === "independent" ? undefined : previous.blend })); }}>Show blending help</button>
          {blendHelp && <p className="mt-3 text-sm text-slate-700">Point to {lesson.checkWord.split("").join(" · ")}, say the sounds, then blend them together. Use “with help” for this attempt.</p>}
          <div className="mt-5 grid gap-5">{READING_SKILLS.map((skill) => <fieldset key={skill.id} className="rounded-xl bg-white p-4">
            <legend className="px-1 font-bold text-slate-950">{skill.label}</legend>
            <div className="flex flex-wrap gap-3">{levels.map((level) => <label key={level.id} className="flex min-h-12 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
              <input type="radio" name={skill.id} value={level.id} checked={observations[skill.id] === level.id} disabled={level.id === "independent" && ((skill.id === "blend" && blendHelp) || (skill.id === "text" && textHelp))} onChange={() => { setObservations({ ...observations, [skill.id]: level.id }); setMessage(""); }} />{level.label}
            </label>)}</div>
            {observations[skill.id] && <button className="mt-2 min-h-11 text-sm font-semibold underline" onClick={() => { setObservations({ ...observations, [skill.id]: undefined }); setMessage(""); }}>Leave unobserved</button>}
          </fieldset>)}</div>
          <button className={`${button} mt-5 bg-teal-800 text-white`} disabled={!Object.values(observations).some(Boolean)} onClick={() => save(Date.now())}>Save observations</button>
          <p className="mt-3 text-sm text-teal-950" role="status">{message}</p>
          {progress[lesson.id] && <button className={`${button} mt-3`} onClick={removeSaved}>Remove saved observations for this lesson</button>}
          {removed && <button className={`${button} mt-3`} onClick={undoRemoval}>Undo removal</button>}
          {message && index < READING_LESSONS.length - 1 && <button className={`${button} mt-3`} onClick={() => begin(index + 1)}>Try the next lesson when ready</button>}
        </>}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-3"><button className={button} disabled={step === 0} onClick={() => setStep(step - 1)}>Previous step</button>{step < 4 && <button className={`${button} bg-teal-800 text-white`} onClick={() => setStep(step + 1)}>Next: {steps[step + 1]}</button>}</div>
      <p className="mt-4 text-sm text-slate-600">{lessonReady(progress, lesson.id) ? "You have independent observations for all four skills on two days." : "Revisit sounds and words across short sessions. Help is part of learning."} Parent observations guide review; this is not a standardized assessment or a reading guarantee.</p>
    </>}

    <details className="mt-6 border-t border-slate-200 pt-4">
      <summary className="min-h-11 cursor-pointer font-bold text-slate-800">Parent guide: accurate sounds & next steps</summary>
      <p className="mt-3 text-sm text-slate-700">A human model matters for isolated sounds. This path uses parent modeling; the device voice does not teach phonemes. Oxford Owl’s recorded guide demonstrates pure sounds and blending in a British accent. Use your family’s natural pronunciation, especially for vowels.</p>
      <a href="https://home.oxfordowl.co.uk/phonics-videos/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block min-h-11 font-bold text-teal-800 underline">Oxford Owl: teacher pronunciation videos ↗</a>
      <p className="mt-2 text-xs text-slate-600">For parents; opens another website. No external video loads here. The recordings are not hosted by Geek Jr.</p>
      <p className="mt-3 text-sm text-slate-700">These eight original lessons cover common single-letter sounds and five short vowels, then blending, spelling, and short connected text. Continue afterward with a full sequence for digraphs, vowel spellings, longer words, fluent reading, and comprehension. Share richer books aloud throughout.</p>
      <p className="mt-3 text-sm text-slate-700">The <a className="underline" href="https://ies.ed.gov/ncee/wwc/PracticeGuide/21" target="_blank" rel="noopener noreferrer">IES foundational reading guide ↗</a> supports linking sounds to letters, decoding and writing, and connected text for kindergarten–grade 3. It is not evidence for teaching independent reading at age one, and Geek Jr’s lessons have not been evaluated in a trial.</p>
    </details>
    <Link href="/parent/#reading-observations" className="mt-4 inline-block min-h-11 text-sm font-bold text-teal-800 underline">View reading observations ↗</Link>
  </section>;
}
