"use client";

import Link from "next/link";
import AudioIcon from "@/modules/common/AudioIcon";
import { useEffect, useRef, useState } from "react";
import cards from "@/data/decks/first-words.json";
import { FIRST_WORDS_KEY, OBSERVATION_LEVELS, WORD_SKILLS, pickWordSession, recordWordObservations, WordCard, WordCardProgress, WordObservations, WordSkill } from "@/lib/firstWords";
import { DEFAULT_SETTINGS, loadSettings } from "@/lib/settings";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { PICTURE_WORD_IDS, WORD_LESSONS, togetherPrompt, wordPool } from "@/lib/wordLessons";
import WordPicture from "./WordPicture";

const wordCards = cards as WordCard[];

type Progress = Record<string, WordCardProgress>;

export default function FirstWordsPlayer() {
  const [progress, setProgress] = useState<Progress>({});
  const progressRef = useRef<Progress>({});
  const [session, setSession] = useState<WordCard[] | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [lesson, setLesson] = useState("");
  const [category, setCategory] = useState("");
  const [focus, setFocus] = useState<WordSkill>("understands");
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [observations, setObservations] = useState<WordObservations>({});
  const [audioMessage, setAudioMessage] = useState("");
  const [earlyPractice, setEarlyPractice] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = loadFromStorage<Progress>(FIRST_WORDS_KEY, {});
      const loaded = loadSettings();
      const params = new URLSearchParams(window.location.search);
      const requestedLesson = WORD_LESSONS.find((item) => item.id === params.get("lesson"))?.id ?? "";
      const requestedCategory = wordCards.some((card) => card.category === params.get("category")) ? params.get("category")! : "";
      const requestedWord = wordCards.find((card) => card.id === params.get("word"));
      progressRef.current = saved;
      setProgress(saved);
      setSettings(loaded);
      setLesson(requestedLesson);
      setCategory(requestedCategory);
      setEarlyPractice(Boolean(requestedWord));
      setSession(requestedWord ? [requestedWord] : pickWordSession(wordPool(wordCards, loaded.ageTier, requestedLesson, requestedCategory), saved, loaded.ageTier === "1-2" ? Math.min(3, loaded.sessionSize) : loaded.sessionSize));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  function speak(word: string) {
    if (!window.speechSynthesis) {
      setAudioMessage("Read the word aloud together. Audio is not available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.onerror = () => setAudioMessage("Read the word aloud together. Audio could not play.");
    window.speechSynthesis.speak(utterance);
    setAudioMessage(focus === "print" ? "The word has been spoken. Record this attempt as helped; try without clues on a later visit." : "Your voice matters too. Say the word naturally and wait for a response.");
    if (focus === "print") setObservations({});
  }

  function startRound(nextLesson = lesson, nextCategory = category, nextFocus = focus, practiceEarly = false) {
    window.speechSynthesis?.cancel();
    const pool = wordPool(wordCards, settings.ageTier, nextLesson, nextCategory);
    const size = settings.ageTier === "1-2" ? Math.min(3, settings.sessionSize) : settings.sessionSize;
    setSession(practiceEarly ? [...pool].sort((a, b) => (progressRef.current[a.id]?.lastSeen ?? 0) - (progressRef.current[b.id]?.lastSeen ?? 0)).slice(0, size) : pickWordSession(pool, progressRef.current, size));
    setLesson(nextLesson);
    setCategory(nextCategory);
    setFocus(nextFocus);
    setIndex(0);
    setCompleted(0);
    setObservations({});
    setAudioMessage("");
    setEarlyPractice(practiceEarly);
    savedRef.current = false;
  }

  function nextWord(save: boolean) {
    const current = session?.[index];
    if (!current || savedRef.current) return;
    savedRef.current = true;
    window.speechSynthesis?.cancel();
    if (save) {
      const updated = {
        ...progressRef.current,
        [current.id]: recordWordObservations(progressRef.current[current.id], observations, focus),
      };
      progressRef.current = updated;
      setProgress(updated);
      saveToStorage(FIRST_WORDS_KEY, updated);
      setCompleted((count) => count + 1);
    }
    setObservations({});
    setAudioMessage("");
    setIndex((position) => position + 1);
  }

  useEffect(() => { savedRef.current = false; }, [index]);

  if (!session) return <p className="rounded-2xl bg-white p-6 text-slate-700">Loading word cards...</p>;

  const current = session[index];
  const pool = wordPool(wordCards, settings.ageTier, lesson, category);
  const nextDue = pool.map((card) => progress[card.id]?.lastSeen).filter((value): value is number => Boolean(value));
  const levels = focus === "print" ? WORD_SKILLS.filter((skill) => skill.id === "print") : WORD_SKILLS.filter((skill) => skill.id !== "print");
  const categories = [...new Set(wordCards.map((card) => card.category))];
  return (
    <section className="jr-first-words mx-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Parent guided · No timer</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">First Words</h1>
      <p className="mt-2 text-sm text-slate-600">Look, say, and play together. Follow your child’s interest and finish whenever they are ready.</p>
      <details className="jr-disclosure jr-options"><summary><span><b>Grown-up options</b><small>Choose a lesson, category or learning focus.</small></span></summary><div className="jr-options-content">
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">Choose a little lesson
          <select value={lesson} onChange={(event) => startRound(event.target.value, "")} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3">
            <option value="">Today’s review & new words</option>
            {WORD_LESSONS.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">Learning focus
          <select value={focus} onChange={(event) => startRound(lesson, category, event.target.value as WordSkill)} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3">
            <option value="understands">Understanding & talking</option>
            <option value="print">Print recognition · when ready</option>
          </select>
        </label>
      </div>
      <details className="mt-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-teal-900">Choose a category or see parent guidance</summary>
        <label className="mt-3 grid gap-1 font-semibold">Word category
          <select value={category} onChange={(event) => startRound("", event.target.value)} className="min-h-12 rounded-lg border border-slate-300 bg-white px-3">
            <option value="">Words for this level</option>{categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <p className="mt-3">For ages 1–2, begin with concrete picture words and up to three cards. Point, name, wait, and respond to gestures or early word attempts. Try the word again with a real object or a different picture.</p>
        <p className="mt-2">Category choices explore the full original deck. Choose words that fit your child’s readiness.</p>
        <p className="mt-2">Leave anything you did not observe blank. These are parent observations, not a reading assessment. Recognizing familiar print does not prove a child can decode new words.</p>
        <p className="mt-2">Audio uses your device’s voice. You can always read aloud instead.</p>
      </details>
      </div></details>
      {current ? (
        <>
          <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-600"><span>{current.category}</span><span>Card {index + 1} of {session.length}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Round progress" aria-valuenow={index} aria-valuemin={0} aria-valuemax={session.length}>
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(index / session.length) * 100}%` }} />
          </div>
          <div className="jr-play-stage mt-5 px-4 py-6 text-center">
            {focus !== "print" && PICTURE_WORD_IDS.has(current.id) && <WordPicture word={current.word} className="mx-auto mb-3 h-44 w-48 sm:h-52 sm:w-56" />}
            <p className="break-words text-5xl font-black tracking-tight text-teal-950 sm:text-6xl">{current.word}</p>
            <button type="button" onClick={() => speak(current.word)} className="mt-5 min-h-12 rounded-xl bg-teal-900 px-5 py-3 font-bold text-white hover:bg-teal-800"><AudioIcon /> Hear the word</button>
            {audioMessage && <p className="mt-3 text-sm text-teal-900" role="status">{audioMessage}</p>}
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{focus === "print" ? "Try without clues" : "Try together, away from the screen"}</p>
            <p className="mt-2 text-base text-slate-800">{focus === "print" ? "Before naming it, ask what the printed word says. Do not point to a picture or play the answer first. If you help, record ‘With help.’" : togetherPrompt(current)}</p>
            {focus !== "print" && <p className="mt-2 text-sm text-slate-600">If your child responds, add a short phrase. Try a different example another day.</p>}
          </div>
          <details className="jr-disclosure jr-observations"><summary><span><b>Grown-up: what did you notice?</b><small>Record understanding or talking when you’re ready.</small></span></summary>
          <div className="observation-fields space-y-4">
            <p className="text-sm font-bold text-slate-800">What did you observe today?</p>
            {levels.map((skill) => <fieldset key={`${current.id}-${skill.id}`} className="rounded-xl border border-slate-200 p-3">
              <legend className="px-1 text-sm font-bold text-slate-900">{skill.label}</legend>
              <p className="mb-3 text-xs text-slate-600">{skill.hint}</p>
              <div className="grid grid-cols-3 gap-2">
                {OBSERVATION_LEVELS.map((level) => <label key={level.id} className={`flex min-h-12 cursor-pointer items-center justify-center gap-1 rounded-lg border px-1 py-2 text-center text-xs font-bold sm:text-sm ${observations[skill.id] === level.id ? "border-teal-700 bg-teal-50 text-teal-950" : "border-slate-300 text-slate-700"}`}>
                  <input type="radio" name={skill.id} value={level.id} checked={observations[skill.id] === level.id} disabled={focus === "print" && Boolean(audioMessage) && level.id === "independent"} onChange={() => setObservations((previous) => ({ ...previous, [skill.id]: level.id }))} className="accent-teal-800" />{level.label}
                </label>)}
              </div>
            </fieldset>)}
          </div>
          <div className="parent-save flex flex-wrap items-center justify-end gap-3">
            <button type="button" disabled={!Object.keys(observations).length} onClick={() => nextWord(true)} className="min-h-12 rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">Save & next word</button>
          </div>
          </details>
          <div className="jr-next-word"><button type="button" onClick={() => nextWord(false)} className="min-h-12 rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900">Next word <span aria-hidden="true">→</span></button></div>
          <p className="mt-2 text-xs text-slate-500">Next word moves on without saving an observation.</p>
          <p className="mt-3 text-xs text-slate-500">{earlyPractice ? "You chose extra practice. This is not a delayed review." : "Due words are reviewed before new words. Already practiced words wait until their next review."}</p>
        </>
      ) : (
        <div className="mt-6 rounded-xl bg-teal-50 p-5 text-teal-950" role="status">
          <h2 className="text-xl font-bold">{session.length ? "Lovely exploring!" : "No words due in this selection"}</h2>
          <p className="mt-2">{session.length ? `You explored ${session.length} words together. Now look for one around you or in a book.` : nextDue.length ? "You have practiced these words recently. Choose another lesson or revisit them on a later day." : "Choose a different lesson to find some words."}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => startRound()} className="min-h-12 rounded-xl bg-teal-800 px-4 py-3 font-bold text-white">Check review & new words</button>
            {pool.length > 0 && <button type="button" onClick={() => startRound(lesson, category, focus, true)} className="min-h-12 rounded-xl border border-teal-600 px-4 py-3 font-bold text-teal-900">Practice this selection again</button>}
          </div>
          <p className="mt-3 text-sm">Grown-up observations saved: {completed}.</p>
          <Link href="/" className="jr-end-home">Back to play</Link><Link href="/parent/#word-observations" className="mt-5 inline-block font-bold underline">See your parent observations</Link>
        </div>
      )}
    </section>
  );
}
