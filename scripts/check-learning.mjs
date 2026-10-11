import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadTypeScript(path) {
  const source = await readFile(path, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { prepareChoiceRound } = await loadTypeScript('src/lib/practice.ts');
const { pickWordSession, recordWordObservations, nextWordProgress } = await loadTypeScript('src/lib/firstWords.ts');
const { wordPool, WORD_LESSONS, PICTURE_WORD_IDS, togetherPrompt } = await loadTypeScript('src/lib/wordLessons.ts');
const cards = JSON.parse(await readFile('src/data/decks/first-words.json', 'utf8'));
let seed = 11;
const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
for (const path of ['phonics/sounds', 'patterns/patterns', 'stories/stories']) {
  const prompts = JSON.parse(await readFile(`src/data/${path}.json`, 'utf8'));
  const original = JSON.stringify(prompts);
  const positions = new Set();
  for (let run = 0; run < 12; run += 1) {
    const prepared = prepareChoiceRound(prompts, 10, random);
    assert.equal(prepared.length, 10);
    assert.equal(new Set(prepared.map((item) => item.id)).size, 10);
    for (const item of prepared) {
      const source = prompts.find((prompt) => prompt.id === item.id);
      assert.deepEqual([...item.choices].sort(), [...source.choices].sort());
      assert.equal(item.correct, source.correct);
      positions.add(item.choices.indexOf(item.correct));
    }
  }
  assert.deepEqual([...positions].sort(), [0, 1, 2], `${path}: correct answers must reach all positions`);
  assert.equal(JSON.stringify(prompts), original, 'A round must not mutate the source deck');
}
const day = 86400000;
const now = 100 * day;
const smallDeck = cards.slice(0, 4);
const progress = {
  [smallDeck[0].id]: { box: 5, lastSeen: now - day, seenCount: 6 },
  [smallDeck[1].id]: { box: 2, lastSeen: now - 2 * day, seenCount: 2 },
  [smallDeck[2].id]: { box: 1, lastSeen: now - 1000, seenCount: 1 },
};
assert.deepEqual(pickWordSession(smallDeck, progress, 10, now).map((card) => card.id), [smallDeck[1].id, smallDeck[3].id], 'Due reviews precede new cards; future reviews never pad the round');
assert.equal(pickWordSession([smallDeck[0]], progress, 3, now).length, 0);
assert.equal(pickWordSession([smallDeck[2]], progress, 3, now + day).length, 1);
const legacy = { box: 3, lastSeen: now - day, seenCount: 4 };
assert.equal(nextWordProgress(legacy, true, now).observations, undefined, 'Legacy practice is not evidence of any language or reading skill');
const speaking = recordWordObservations(legacy, { speaks: 'independent' }, 'understands', now);
assert.equal(speaking.box, legacy.box, 'Speaking alone must not advance understanding reviews');
assert.equal(speaking.observations.understands, undefined);
assert.equal(speaking.observations.print, undefined);
assert.equal(speaking.observations.speaks.independentCount, 1);
const understanding = recordWordObservations(speaking, { understands: 'with-help' }, 'understands', now + day);
assert.equal(understanding.observations.speaks.level, 'independent', 'New observations preserve other skills');
assert.equal(understanding.box, 2);
const printed = recordWordObservations(understanding, { print: 'independent' }, 'print', now + 2 * day);
assert.equal(printed.observations.print.independentCount, 1);
assert.equal(printed.observations.understands.level, 'with-help');
assert.equal(printed.seenCount, 7);
const toddlerPool = wordPool(cards, '1-2');
assert.equal(toddlerPool.length, 20);
assert.ok(toddlerPool.every((card) => PICTURE_WORD_IDS.has(card.id) && card.category !== 'Sight Words'));
assert.equal(wordPool(cards, '5-7').length, 112, 'The full original deck remains available');
assert.equal(wordPool(cards, '1-2', '', 'Sight Words').length, 66, 'An explicit parent category choice can explore the full deck');
const pictureSource = await readFile('src/modules/first-words/WordPicture.tsx', 'utf8');
for (const lesson of WORD_LESSONS) {
  const pool = wordPool(cards, '1-2', lesson.id);
  assert.equal(pool.length, lesson.words.length);
  assert.ok(pool.length >= 3);
  for (const card of pool) {
    assert.ok(pictureSource.includes(`case "${card.word}"`), `${card.word}: missing illustration`);
    assert.ok(togetherPrompt(card).length > 40, `${card.word}: missing parent activity`);
  }
}
console.log('Learning checks: answer positions, review dates, independent skill observations, legacy progress, and all 20 picture words passed');

const { READING_LESSONS, READING_SKILLS, SOUND_CUES, recordReading, cleanReadingProgress, lessonReady, suggestedReadingLesson } = await loadTypeScript('src/lib/reading.ts');
const taught = new Set();
const helpers = new Set();
const ids = new Set();
for (const lesson of READING_LESSONS) {
  assert.ok(!ids.has(lesson.id), 'Reading lesson IDs must be unique');
  ids.add(lesson.id);
  for (const letter of lesson.letters) {
    assert.ok(SOUND_CUES[letter], `Missing parent sound cue: ${letter}`);
    assert.ok(!taught.has(letter), `Letter ${letter} introduced twice`);
    taught.add(letter);
  }
  for (const letter of lesson.reviewLetters ?? "") assert.ok(taught.has(letter) && SOUND_CUES[letter], `Review requires a taught sound: ${letter}`);
  lesson.helperWords.forEach((word) => helpers.add(word));
  for (const word of [...lesson.words, lesson.checkWord, ...lesson.text.join(' ').toLowerCase().match(/[a-z]+/g)]) {
    if (helpers.has(word)) continue;
    assert.ok([...word].every((letter) => taught.has(letter)), `${lesson.id}: ${word} includes untaught letters`);
    // Reject accidental digraphs or long-vowel patterns in this short-vowel sequence.
    assert.ok(!/(sh|ch|th|ph|ng|ee|ea|oa|ai|ay|igh|oo|ou|ow)/.test(word), `${lesson.id}: ${word} requires an untaught spelling`);
  }
  assert.ok(!lesson.words.includes(lesson.checkWord), 'The transfer word must not be in its practice list');
  assert.ok(!lesson.text.join(' ').toLowerCase().match(/[a-z]+/g).includes(lesson.checkWord), 'The transfer word must not appear in its reading text');
  assert.ok(lesson.question && lesson.answer, 'Connected text needs a comprehension discussion');
}
assert.equal(READING_LESSONS.length, 10);
assert.equal(taught.size, 25);
assert.deepEqual([...helpers], ['a']);
assert.equal(suggestedReadingLesson({}), 0);
const independent = Object.fromEntries(READING_SKILLS.map((skill) => [skill.id, 'independent']));
let reading = recordReading({}, 'satpin', independent, now);
assert.equal(lessonReady(reading, 'satpin'), false, 'One day is not two-day evidence');
reading = recordReading(reading, 'satpin', independent, now + 1000);
assert.equal(reading.satpin.blend.independentDays.length, 1, 'Repeated saves on one day cannot inflate review evidence');
reading = recordReading(reading, 'satpin', independent, now + day);
assert.equal(lessonReady(reading, 'satpin'), true);
assert.equal(suggestedReadingLesson(reading), 1);
const helped = recordReading(reading, 'satpin', { blend: 'with-help' }, now + 2 * day);
assert.equal(helped.satpin.blend.independentDays.length, 0, 'A new need for help resets that skill’s count');
assert.equal(helped.satpin.text.independentDays.length, 2, 'Other skill evidence is preserved');
assert.equal(suggestedReadingLesson(helped), 0);
assert.equal(reading.satpin.blend.level, 'independent', 'Saving must not mutate old progress');
assert.deepEqual(cleanReadingProgress({ satpin: { blend: { level: 'fake', date: 1, independentDays: [] } }, unknown: {} }), {});
assert.deepEqual(cleanReadingProgress(reading), reading);
const phonics = JSON.parse(await readFile('src/data/phonics/sounds.json', 'utf8'));
assert.ok(!phonics.some((prompt) => prompt.choices.some((choice) => ['buh', 'kuh', 'tuh', 'mmm', 'sss', 'fff', 'rrr', 'zzz'].includes(choice))), 'Quiz choices must not use synthetic pseudo-phonemes');
console.log('Reading checks: taught-letter coverage, transfer words, helper words, sound cues, two-day observations, regressions, and invalid storage passed');

const { countingRound } = await loadTypeScript('src/lib/counting.ts');
for (const age of ['1-2', '3-4', '5-7', '8-10']) for (let run = 0; run < 20; run++) {
  const round = countingRound(age, 10, random);
  assert.ok(round.length > 0 && round.length <= 10);
  assert.equal(new Set(round.map(q => q.id)).size, round.length);
  for (const q of round) {
    assert.equal(q.answer, q.operation === 'add' ? q.left + q.right : q.operation === 'take' ? q.left - q.right : q.left);
    assert.equal(q.choices.length, 3); assert.equal(new Set(q.choices).size, 3); assert.ok(q.choices.includes(q.answer));
    assert.ok(q.choices.every(n => Number.isInteger(n) && n >= 0));
    if (age !== '8-10') assert.equal(q.operation, 'count');
    if (age === '1-2') assert.ok(q.left <= 3);
    if (age === '3-4') assert.ok(q.left <= 5);
  }
}
assert.equal(countingRound('5-7', 3, random).length, 3);
console.log('Counting checks: age bounds, untimed round sizes, unique prompts, arithmetic and answer choices passed');
