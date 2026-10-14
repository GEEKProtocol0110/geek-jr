'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readFamily } from '@/lib/family';
import { FIRST_WORDS_KEY, type WordCardProgress } from '@/lib/firstWords';
import { cleanReadingProgress, READING_KEY, type ReadingProgress } from '@/lib/reading';
import { loadFromStorage, saveToStorageOrThrow } from '@/lib/storage';
import { cleanRewardPlan, emptyRewardPlan, learningMilestones, REWARD_PLAN_KEY, REWARD_PROPOSAL, reviewLearningMilestone, rewardPlanSummary, type RewardPlan } from '@/lib/learningRewards';

const button = 'min-h-12 rounded-xl border border-teal-700 bg-white px-4 py-3 font-bold text-teal-950 disabled:opacity-40';
export default function LearningRewards() {
  const [loaded, setLoaded] = useState(false);
  const [available, setAvailable] = useState(false);
  const [words, setWords] = useState<Record<string, WordCardProgress>>({});
  const [reading, setReading] = useState<ReadingProgress>({});
  const [plan, setPlan] = useState<RewardPlan>(emptyRewardPlan);
  const [now, setNow] = useState(0);
  const [message, setMessage] = useState('');
  const [group, setGroup] = useState('First Words');
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        readFamily(localStorage);
        const at = Date.now(); setNow(at);
        setWords(loadFromStorage(FIRST_WORDS_KEY, {}));
        setReading(cleanReadingProgress(loadFromStorage(READING_KEY, {})));
        setPlan(cleanRewardPlan(loadFromStorage(REWARD_PLAN_KEY, emptyRewardPlan()), at));
        setAvailable(true);
      } catch { setMessage('This browser could not read the learner records. Reload after restoring storage access. Existing data was not changed.'); }
      setLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const milestones = learningMilestones(words, reading, plan, now);
  const summary = rewardPlanSummary(milestones);
  function review(id: string, at: number) {
    try {
      // Re-read observations before a save; stale pages cannot approve a removed observation.
      const currentWords = loadFromStorage<Record<string, WordCardProgress>>(FIRST_WORDS_KEY, {});
      const currentReading = cleanReadingProgress(loadFromStorage(READING_KEY, {}));
      const currentPlan = cleanRewardPlan(loadFromStorage(REWARD_PLAN_KEY, emptyRewardPlan()), at);
      setWords(currentWords); setReading(currentReading); setNow(at);
      const next = reviewLearningMilestone(currentPlan, id, currentWords, currentReading, at);
      saveToStorageOrThrow(REWARD_PLAN_KEY, next);
      setWords(currentWords); setReading(currentReading); setPlan(next); setNow(at);
      setMessage('Parent review saved locally. This creates no GEEK balance, payout claim or reserved funds.');
    } catch (error) { setMessage(`${(error as Error).message} No review or reward was saved by this action.`); }
  }
  return <main id="main-content" className="activity-page"><section className="jr-parent">
    <div className="jr-parent-heading"><h1 className="text-3xl font-black text-slate-950">Learning reward plan</h1><Link className="back-link" href="/parent">← For grown-ups</Link></div>
    <p className="mt-4 text-slate-700">Geek Jr is part of Geek Protocol’s learn-and-earn vision. Plan small learning rewards with a parent or caregiver, at the child’s pace.</p>
    <div className="mt-5 rounded-2xl border-2 border-amber-700 bg-amber-50 p-5 text-slate-900">
      <h2 className="text-xl font-bold">Proposed: {REWARD_PROPOSAL.geekPerMilestone} GEEK per unique learning milestone</h2>
      <p className="mt-3"><strong>Planning only. No GEEK is earned, owed, funded or sent here.</strong> These editable local observations and parent reviews are not verified payout evidence. A parent account, funded budget and server-verified reward system are still required for real payments.</p>
      <p className="mt-3 text-sm">Replaying lessons never adds another entry for the same milestone. Help, gestures and word attempts are welcome in First Words. Reading evidence uses the existing two-day practice rule. No timers, wallet connection or microphone are added.</p>
    </div>
    {!loaded ? <p className="mt-5" role="status">Reading this learner’s milestones…</p> : !available ? <p className="mt-5" role="status">{message}</p> : <>
      <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-5"><h2 className="text-xl font-bold text-teal-950">This learner’s local draft</h2><p className="mt-2 text-teal-950">{summary.reviewedMilestones} currently reviewed milestones · {summary.proposedGeek} GEEK proposed. <strong>This is not a token balance.</strong></p><p className="mt-2 text-sm text-teal-900">New help, removed observations or newer evidence can require another parent review. That updates the same entry and never multiplies its amount. Choose the learner on the parent page before starting; this page stays with the learner it opened for.</p></div>
      <div className="mt-6 flex flex-wrap gap-3" role="group" aria-label="Milestone group">{['First Words','Reading Path'].map(name => <button key={name} type="button" aria-pressed={group === name} className={`${button} ${group === name ? 'ring-2 ring-teal-700' : ''}`} onClick={() => setGroup(name)}>{name}</button>)}</div>
      <ul className="mt-5 grid list-none gap-4 sm:grid-cols-2">{milestones.filter(item => item.group === group).map(item => <li key={item.id} className="rounded-2xl border border-slate-300 bg-white p-5">
        <h3 className="text-xl font-bold text-slate-950">{item.title}</h3><p className="mt-2 text-sm text-slate-700">{item.criteria}</p>
        <p className="mt-3 font-bold text-teal-950">{item.reviewed ? 'Reviewed locally · 100 GEEK proposed' : item.ready ? 'Observations available · needs parent review' : 'Keep exploring · observations still needed'}</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link className={button} href={item.href}>Open lesson →</Link><button type="button" className={button} disabled={!item.ready || item.reviewed} onClick={() => review(item.id, Date.now())}>{item.reviewed ? 'Review saved' : 'Review this milestone'}</button></div>
      </li>)}</ul>
      <p className="mt-5 text-sm text-teal-950" role="status" aria-live="polite">{message}</p>
    </>}
    <details className="jr-disclosure mt-6"><summary><span><b>How this can become real GEEK rewards</b><small>Parent-managed payouts and a funded learning budget.</small></span></summary><div className="jr-parent-panel"><p>Before payments launch, HQ must bind each milestone to a verified parent and learner, check eligibility, reserve funds against a global budget, reject duplicate claims across devices and backups, and confirm each GEEK transfer to the parent-managed receiving address. Browser records, screenshots and imported backups will not authorize payouts.</p><p className="mt-3">This page makes no network request for learner data or reviews and stores no wallet address. Reviews travel with the local learner’s progress backup; restoring a copy does not establish a new reward entitlement.</p></div></details>
  </section></main>;
}
