import { readFamily, writeFamily, RECORD_KEYS } from './family';
let visitLearner: string | undefined;
function context() {
  const family = readFamily(window.localStorage);
  visitLearner ??= family.activeId;
  const child = family.learners.find(item => item.id === visitLearner);
  if (!child) throw new Error('The selected learner is unavailable. Reload to choose a learner.');
  return {family,child};
}
export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    if (!(RECORD_KEYS as readonly string[]).includes(key)) return fallback;
    return (context().child.records[key] ?? fallback) as T;
  } catch { return fallback; }
}
export function saveToStorageOrThrow<T>(key: string, value: T) {
  if (typeof window === 'undefined') throw new Error('Browser storage unavailable');
  if (!(RECORD_KEYS as readonly string[]).includes(key)) throw new Error('Unknown progress record');
  const {family,child} = context();
  child.records[key] = value;
  writeFamily(window.localStorage,family);
}
export function saveToStorage<T>(key: string, value: T): boolean {
  try { saveToStorageOrThrow(key,value); return true; } catch { return false; }
}
