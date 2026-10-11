export type ReadingLevel = "not-yet" | "with-help" | "independent";
export const READING_KEY = "geekjr_reading_v1";
export const READING_SKILLS = [
  { id: "sounds", label: "Letter sounds" },
  { id: "blend", label: "Blend a new word" },
  { id: "spell", label: "Spell from sounds" },
  { id: "text", label: "Read & understand" },
] as const;
export type ReadingSkill = typeof READING_SKILLS[number]["id"];
export type ReadingObservation = { level: ReadingLevel; date: number; independentDays: string[] };
export type ReadingProgress = Record<string, Partial<Record<ReadingSkill, ReadingObservation>>>;
export type ReadingLesson = {
  id: string; title: string; letters: string; reviewLetters?: string; words: string[]; checkWord: string;
  text: string[]; question: string; answer: string; helperWords: string[];
};

// Original starter content. Short vowels; c and k both represent /k/.
// x represents two sounds, /k/ /s/. This is not a complete phonics curriculum.
export const READING_LESSONS: ReadingLesson[] = [
  { id: "satpin", title: "Our first six sounds", letters: "satpin", words: ["sat", "pin", "tap"], checkWord: "nap", text: ["Pat sat."], question: "Who sat?", answer: "Pat. Try acting out sitting together.", helperWords: [] },
  { id: "md", title: "Meet Sam and Tim", letters: "md", words: ["mat", "dim", "man"], checkWord: "dip", text: ["Sam sat.", "Tim sat."], question: "Who else sat?", answer: "Tim. Two people sat.", helperWords: [] },
  { id: "ogck", title: "Pat’s pets", letters: "ogck", words: ["dog", "cat", "cot"], checkWord: "kit", text: ["Pat got a cat.", "Pat got a dog."], question: "What pets did Pat get?", answer: "A cat and a dog. Talk about caring for pets.", helperWords: ["a"] },
  { id: "er", title: "A red pen", letters: "er", words: ["red", "pen", "rat"], checkWord: "pet", text: ["Sam got a red pen.", "Pat got a red mat."], question: "What did Sam get?", answer: "A red pen. What could Sam draw?", helperWords: [] },
  { id: "uhb", title: "Hide in a hut", letters: "uhb", words: ["hut", "bun", "mud"], checkWord: "bug", text: ["Sam hid in a hut.", "Sam dug in mud."], question: "Where did Sam hide?", answer: "In a hut. What did Sam do afterward?", helperWords: [] },
  { id: "fl", title: "A cat on a log", letters: "fl", words: ["fan", "leg", "fit"], checkWord: "lip", text: ["A cat sat on a log.", "It ran in fog."], question: "Where did the cat sit?", answer: "On a log. Act out sitting and running.", helperWords: [] },
  { id: "jvw", title: "Visit a vet", letters: "jvw", words: ["jam", "vet", "wet"], checkWord: "wag", text: ["A vet met a dog.", "It sat in a van."], question: "Who met the dog?", answer: "A vet. A vet helps animals stay well. ‘It’ refers to the dog here.", helperWords: [] },
  { id: "yzx", title: "A fox in a box", letters: "yzx", words: ["yes", "zip", "fox"], checkWord: "yak", text: ["A fox ran.", "It hid in a box."], question: "Where did the fox hide?", answer: "In a box. Retell the two things the fox did.", helperWords: [] },
  { id: "four-sounds", title: "Four sounds, one word", letters: "", reviewLetters: "tlmsndcp", words: ["tent", "lamp", "sand"], checkWord: "camp", text: ["Sam sat in a tent.", "A lamp lit a mat."], question: "What lit the mat?", answer: "A lamp. Retell where Sam sat, then what the lamp did.", helperWords: [] },
  { id: "blends", title: "Keep every sound", letters: "", reviewLetters: "frgstlp", words: ["frog", "stop", "flag"], checkWord: "grip", text: ["Pat got a flag.", "A frog sat on a log."], question: "Where did the frog sit?", answer: "On a log. Listen for both consonants at the start of frog; do not add a vowel between them.", helperWords: [] },
];

export const SOUND_CUES: Record<string, string> = {
  s: "As at the start of sun. Let air hiss gently; keep the sound going.",
  a: "Short a, as in apple and cat. Open your mouth; use your natural accent.",
  t: "As at the start of tap. A quick tongue release, without adding ‘uh’.",
  p: "As at the start of pin. A quick lip release, without adding ‘uh’.",
  i: "Short i, as in ink and pin. Keep it short, not the letter name.",
  n: "As at the start of nap. Tongue touches behind upper teeth; hum through your nose.",
  m: "As at the start of mat. Lips together; hum and keep the sound going.",
  d: "As at the start of dog. A quick tongue release, without adding ‘uh’.",
  o: "Short o, as in dog and cot. Vowel pronunciation varies with your accent.",
  g: "As at the start of got. A quick sound at the back of the mouth; no extra ‘uh’.",
  c: "As at the start of cat. Use the /k/ sound here, not the letter name.",
  k: "As at the start of kit. The same sound as c in cat; no extra ‘uh’.",
  e: "Short e, as in egg and pen. Keep it short, not the letter name.",
  r: "As at the start of red. Use your natural accent; keep the sound going.",
  u: "Short u, as in up and bun. Use your natural accent.",
  h: "As at the start of hut. A gentle breath out; no extra vowel.",
  b: "As at the start of bun. A quick lip release, without adding ‘uh’.",
  f: "As at the start of fan. Upper teeth gently touch lower lip; let air flow.",
  l: "As at the start of leg. Tongue behind upper teeth; keep the sound going.",
  j: "As at the start of jam. Keep it brief, without adding ‘uh’.",
  v: "As at the start of vet. Teeth touch lower lip; use your voice as air flows.",
  w: "As at the start of wet. Round lips, then release; no extra vowel.",
  y: "As at the start of yes. Use the sound in yes, not the letter name.",
  z: "As at the start of zip. Like s, but with your voice: a gentle buzz.",
  x: "As at the end of fox. This letter stands for two sounds: /k/ then /s/.",
};

export function taughtLetters(index: number) {
  return READING_LESSONS.slice(0, index + 1).map((lesson) => lesson.letters).join("");
}

export function lessonReady(progress: ReadingProgress, id: string) {
  return READING_SKILLS.every(({ id: skill }) => progress[id]?.[skill]?.level === "independent" && progress[id]![skill]!.independentDays.length >= 2);
}

export function suggestedReadingLesson(progress: ReadingProgress) {
  return READING_LESSONS.findIndex((lesson) => !lessonReady(progress, lesson.id));
}

export function recordReading(progress: ReadingProgress, id: string, observations: Partial<Record<ReadingSkill, ReadingLevel>>, now: number): ReadingProgress {
  const day = new Date(now).toLocaleDateString("en-CA");
  const next = { ...progress[id] };
  for (const { id: skill } of READING_SKILLS) {
    const level = observations[skill];
    if (!level) continue;
    const previousDays = next[skill]?.independentDays ?? [];
    next[skill] = { level, date: now, independentDays: level === "independent" ? [...new Set([...previousDays, day])].slice(-2) : [] };
  }
  return { ...progress, [id]: next };
}

// Validate local data rather than allowing malformed browser records to break a lesson.
export function cleanReadingProgress(value: unknown): ReadingProgress {
  const result: ReadingProgress = {};
  if (!value || typeof value !== "object") return result;
  for (const lesson of READING_LESSONS) {
    const raw = (value as Record<string, unknown>)[lesson.id];
    if (!raw || typeof raw !== "object") continue;
    for (const { id } of READING_SKILLS) {
      const observation = (raw as Record<string, ReadingObservation>)[id];
      if (!observation || !["not-yet", "with-help", "independent"].includes(observation.level) || !Number.isFinite(observation.date) || !Array.isArray(observation.independentDays)) continue;
      result[lesson.id] ??= {};
      result[lesson.id][id] = { ...observation, independentDays: [...new Set(observation.independentDays.filter((day) => typeof day === "string"))].slice(-2) };
    }
  }
  return result;
}
