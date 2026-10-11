// One local document makes migration and imports atomic. No child data leaves this browser.
export const FAMILY_KEY = 'geekjr_family_v1';
export const RECORD_KEYS = ['geekjr_settings_v2', 'geekjr_cards_leitner_v1', 'geekjr_first_words_v1', 'geekjr_reading_v1', 'geekjr_stats_phonics_v1', 'geekjr_stats_memory_v2', 'geekjr_stats_patterns_v1', 'geekjr_stats_stories_v1'] as const;
export type Learner = { id: string; name: string; records: Record<string, unknown> };
export type Family = { version: 1; activeId: string; learners: Learner[] };
const invalid = () => { throw new Error('This is not a supported Geek Jr backup. Nothing was changed.'); };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, allowed: string[]) => Object.keys(v).every(k => allowed.includes(k));
const integer = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0;
const level = (v: unknown) => ['not-yet', 'with-help', 'independent'].includes(v as string);
export function validRecord(key: string, value: unknown): boolean {
  if (!object(value)) return false;
  if (key === 'geekjr_settings_v2') return exact(value, ['sessionSize', 'timeLimitSec', 'ageTier', 'christianPacks']) && [3,5,10].includes(value.sessionSize as number) && [0,60,120,180].includes(value.timeLimitSec as number) && ['1-2','3-4','5-7','8-10'].includes(value.ageTier as string) && typeof value.christianPacks === 'boolean';
  if (Object.keys(value).length > 200 || Object.keys(value).some(k => !/^[a-zA-Z0-9_-]{1,80}$/.test(k) || ['__proto__','constructor','prototype'].includes(k))) return false;
  if (key === 'geekjr_cards_leitner_v1') return Object.values(value).every(v => [1,2,3].includes(v as number));
  if (key === 'geekjr_first_words_v1') return Object.values(value).every(v => object(v) && exact(v,['box','lastSeen','seenCount','observations']) && [1,2,3,4,5].includes(v.box as number) && integer(v.lastSeen) && integer(v.seenCount) && (v.observations === undefined || object(v.observations) && exact(v.observations,['understands','speaks','print']) && Object.values(v.observations).every(o => object(o) && exact(o,['level','lastObserved','independentCount']) && level(o.level) && integer(o.lastObserved) && integer(o.independentCount))));
  if (key === 'geekjr_reading_v1') return Object.values(value).every(v => object(v) && exact(v,['sounds','blend','spell','text']) && Object.values(v).every(o => object(o) && exact(o,['level','date','independentDays']) && level(o.level) && integer(o.date) && Array.isArray(o.independentDays) && o.independentDays.length <= 2 && o.independentDays.every(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))));
  if (key.startsWith('geekjr_stats_')) return exact(value,['1-2','3-4','5-7','8-10']) && Object.values(value).every(v => object(v) && exact(v,['totalAttempts','correctCount','bestStreak']) && integer(v.totalAttempts) && integer(v.correctCount) && integer(v.bestStreak) && (v.correctCount as number) <= (v.totalAttempts as number));
  return false;
}
export function parseFamily(text: string): Family {
  if (text.length > 512000) invalid();
  let v: unknown; try { v = JSON.parse(text); } catch { return invalid(); }
  if (!object(v) || !exact(v,['version','activeId','learners']) || v.version !== 1 || !Array.isArray(v.learners) || v.learners.length < 1 || v.learners.length > 8) invalid();
  const family = v as unknown as Family;
  const seen = new Set();
  for (const child of family.learners) {
    if (!object(child) || !exact(child,['id','name','records']) || typeof child.id !== 'string' || !/^(legacy|[a-f0-9]{24})$/.test(child.id) || seen.has(child.id) || typeof child.name !== 'string' || child.name.trim() !== child.name || child.name.length < 1 || child.name.length > 30 || /[\x00-\x1f\x7f]/.test(child.name) || !object(child.records)) invalid();
    seen.add(child.id);
    for (const [key,value] of Object.entries(child.records)) if (!(RECORD_KEYS as readonly string[]).includes(key) || !validRecord(key,value)) invalid();
  }
  if (!seen.has(family.activeId)) invalid();
  return family;
}
export function readFamily(storage: Storage): Family {
  const raw = storage.getItem(FAMILY_KEY);
  if (raw !== null) return parseFamily(raw);
  const records: Record<string,unknown> = {};
  for (const key of RECORD_KEYS) {
    const old = storage.getItem(key); if (old === null) continue;
    let value: unknown; try { value = JSON.parse(old); } catch { throw new Error('An existing progress record needs repair. Export browser data before making changes.'); }
    if (!validRecord(key,value)) throw new Error('An existing progress record needs repair. It has been preserved.');
    records[key] = value;
  }
  return {version:1,activeId:'legacy',learners:[{id:'legacy',name:'My learner',records}]};
}
export function writeFamily(storage: Storage, family: Family) {
  const serialized = JSON.stringify(family); parseFamily(serialized);
  storage.setItem(FAMILY_KEY,serialized);
}
export function newLearner(name: string, id = [...crypto.getRandomValues(new Uint8Array(12))].map(n => n.toString(16).padStart(2,'0')).join('')): Learner {
  return {id,name:name.trim(),records:{}};
}
export function appendBackup(family: Family, backup: Family, makeId: () => string): Family {
  const emptyDefault = family.learners.length === 1 && family.learners[0].id === 'legacy' && family.learners[0].name === 'My learner' && Object.keys(family.learners[0].records).length === 0;
  const existing = emptyDefault ? [] : family.learners;
  if (existing.length + backup.learners.length > 8) throw new Error('Up to eight learners fit on this device. Import fewer profiles on another browser.');
  const restored = backup.learners.map(child => ({...child,id:makeId(),name:child.name.slice(0,21)+' restored'}));
  const next: Family = {...family,activeId:emptyDefault ? restored[0].id : family.activeId,learners:[...existing,...restored]};
  return parseFamily(JSON.stringify(next));
}
