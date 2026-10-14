import { READING_LESSONS, READING_SKILLS, type ReadingProgress } from './reading';
import { WORD_LESSONS } from './wordLessons';
import type { WordCardProgress } from './firstWords';

export const REWARD_PLAN_KEY = 'geekjr_reward_plan_v1';
export const REWARD_PROPOSAL = Object.freeze({ geekPerMilestone: '100', status: 'planning-only', payoutsEnabled: false, fundingVerified: false, serverVerified: false });
export type RewardPlan = { version: 1; reviews: Record<string, { reviewedAt: number }> };
export const emptyRewardPlan = (): RewardPlan => ({ version: 1, reviews: {} });
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const validTime = (value: unknown, now: number): value is number => Number.isSafeInteger(value) && (value as number) > 0 && (value as number) <= now;
function localDay(time: number) { const date = new Date(time); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function validDay(day: unknown, latest: number) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const parsed = new Date(`${day}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day && day <= localDay(latest);
}
const milestoneIds = new Set([...WORD_LESSONS.map(lesson => `words-${lesson.id}`), ...READING_LESSONS.map(lesson => `reading-${lesson.id}`)]);
export function cleanRewardPlan(value: unknown, now = Date.now()): RewardPlan {
  const plan = emptyRewardPlan();
  if (!object(value) || value.version !== 1 || !object(value.reviews)) return plan;
  for (const [id, review] of Object.entries(value.reviews)) {
    if (milestoneIds.has(id) && object(review) && validTime(review.reviewedAt, now)) plan.reviews[id] = { reviewedAt: review.reviewedAt };
  }
  return plan;
}
export function learningMilestones(words: Record<string, WordCardProgress>, reading: ReadingProgress, plan: RewardPlan, now = Date.now()) {
  const safePlan = cleanRewardPlan(plan, now);
  const candidates = [
    ...WORD_LESSONS.map(lesson => {
      const evidence = lesson.words.map(id => {
        const observations = words[id]?.observations;
        return Math.max(0, ...(['understands', 'speaks'] as const).flatMap(skill => {
          const item = observations?.[skill];
          return item && ['with-help', 'independent'].includes(item.level) && validTime(item.lastObserved, now) ? [item.lastObserved] : [];
        }));
      });
      return { id: `words-${lesson.id}`, title: lesson.title, href: `/first-words?lesson=${lesson.id}`, group: 'First Words',
        criteria: `A parent-observed response for each of ${lesson.words.length} illustrated words. Understanding, a gesture or a meaningful word attempt counts; help is welcome. No print test.`,
        ready: evidence.every(date => date > 0), evidenceAt: Math.max(...evidence) };
    }),
    ...READING_LESSONS.map(lesson => {
      const evidence = READING_SKILLS.map(skill => reading[lesson.id]?.[skill.id]);
      const ready = evidence.every(item => item && item.level === 'independent' && validTime(item.date, now) &&
        Array.isArray(item.independentDays) && new Set(item.independentDays.filter(day => validDay(day, item.date))).size >= 2);
      return { id: `reading-${lesson.id}`, title: lesson.title, href: `/phonics?lesson=${lesson.id}`, group: 'Reading Path',
        criteria: 'Parent observations of sounds, a fresh word, spelling and understanding on two different days for each skill. This guides review; it is not a validated mastery test.',
        ready, evidenceAt: ready ? Math.max(...evidence.map(item => item!.date)) : 0 };
    }),
  ];
  return candidates.map(item => ({ ...item, reviewed: item.ready && (safePlan.reviews[item.id]?.reviewedAt ?? 0) >= item.evidenceAt,
    reviewedAt: safePlan.reviews[item.id]?.reviewedAt, proposedGeek: REWARD_PROPOSAL.geekPerMilestone }));
}
export function reviewLearningMilestone(plan: RewardPlan, id: string, words: Record<string, WordCardProgress>, reading: ReadingProgress, now = Date.now()): RewardPlan {
  const milestone = learningMilestones(words, reading, plan, now).find(item => item.id === id);
  if (!milestone?.ready || !validTime(now, now)) throw new Error('Record the current parent observations before reviewing this milestone.');
  const clean = cleanRewardPlan(plan, now);
  if (milestone.reviewed) return clean;
  return { version: 1, reviews: { ...clean.reviews, [id]: { reviewedAt: now } } };
}
export function rewardPlanSummary(milestones: ReturnType<typeof learningMilestones>) {
  const reviewed = milestones.filter(item => item.reviewed);
  return { reviewedMilestones: reviewed.length, proposedGeek: (BigInt(reviewed.length) * BigInt(REWARD_PROPOSAL.geekPerMilestone)).toString(),
    payoutsEnabled: false, fundingVerified: false, serverVerified: false };
}
