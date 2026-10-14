# Content guidelines

Geek Jr is a starter practice library for ages 1–10. It is built for short sessions and for a parent or caregiver to help when needed.

## Age ranges

| Tier | Guideline |
| --- | --- |
| `1-2` | Concrete pictures and common words; parent reads prompts aloud; no timer |
| `3-4` | Familiar objects, simple sounds, and short sequences |
| `5-7` | Beginning reading, counting, and two-step reasoning |
| `8-10` | More detailed reading, patterns, and reasoning |

Keep one clear answer per question. Avoid trick wording, frightening examples, and unnecessary reading load. Audio from browser speech synthesis helps accessibility but is not a substitute for carefully checked phonics audio.

## Data format

Multiple-choice prompts in `src/data/phonics`, `src/data/patterns`, and `src/data/stories` use `id`, `tier`, `prompt`, `choices`, and `correct`. The `correct` value must be one of the `choices`. A story prompt may set `"pack": "christian"` to include it only when a parent turns on Bible story questions.

Picture cards in `src/data/decks` use `id`, `tier`, `question`, `answer`, and optional `visual`. Memory pairs in `src/data/memory` use `id`, `tier`, `label`, and `visual`; the matching game makes two tiles from each pair.

For every change, try the relevant age tier in Parent settings and complete a full round. Content should remain useful without internet access after the app loads.

## First Words lessons

The original 112-word deck remains available. The default ages 1–2 path draws from 20 concrete illustrated words in six themes, with at most three cards per round. Parents can deliberately choose a category or individual card from the full deck. Illustrations are original SVG drawings, not photographs; use the parent prompt to connect each word with real objects, people, or books.

The teaching loop is picture + printed word, parent naming, a real-world action, waiting for a response, and an optional parent observation. Understanding and saying/attempting a word are separate observations. Print recognition is an optional focus that hides illustrations; playing the spoken answer prevents an independent print observation for that attempt. Recognizing memorized print is not evidence of decoding unfamiliar words. The app does not record or grade a child's voice, diagnose development, or promise reading at a particular age.

Record only what was observed: not yet, with help, or on their own. Existing Got it marks are retained as practice history and never converted to skill observations. Due reviews precede new cards. Recently practiced words do not fill a review round before their interval; parents can choose clearly labeled extra practice. Intervals are 1, 1, 3, 7, and 14 days across the five review boxes.

All ages can use untimed practice. The toddler Memory Match mode presents two visible pairs; older modes retain hidden-card recall. Multiple-choice answer positions shuffle once per round and stay stable while a question is being answered. First-try results are shown separately from retries.

Run `npm run check:content` for dataset and learning regression checks, then `npm run lint` and `npm run build`. Manually check a toddler lesson, saved parent observations, print mode, individual-word links, visible matching, and an older untimed round.

## Reading starter sequence

`src/lib/reading.ts` defines fourteen original readiness-based lessons: eight sound introductions and six short-vowel reviews. Review before adding content: every practice word, check word, and connected-text word must use already introduced sound spellings. Letter coverage alone is not sufficient: avoid untaught digraphs, long vowels and irregular pronunciations. Introduce consonant clusters deliberately in review lessons and retain every consonant sound while blending. The current short-vowel path teaches 25 single letters, including x as /k/ /s/. The helper word `a` is introduced separately in lesson three and reviewed before later text. Transfer words must not appear in the same lesson's practice list or text. Include meaning and comprehension alongside decoding.

These are starter lessons, not a complete curriculum or a validated infant reading program. Ages 1–2 start with responsive oral language and sound play. Parents choose print by readiness and may revisit or skip suggested lessons. Letter tiles support practice; automatic tap results cannot demonstrate decoding or spelling. Keep the separate parent skill observations and do not infer reading from prior game scores or familiar-word recognition. Two-day independent counts guide practice only; needing help resets the count for that skill. If a word is already familiar, do not mark a fresh decoding observation from recognition alone. Revealing blending/text support disables the corresponding independent mark for that attempt; restart the lesson for a fresh attempt.

Use human modeling for isolated phonemes. Do not pass letter names or invented strings such as ‘buh’ or ‘kuh’ to speech synthesis as phonics models. The Reading Path links to Oxford Owl's official pronunciation guide for parents, rather than copying or embedding it. Its British-accent models need natural family-accent adaptation. Hosted recordings require verified redistribution rights, attribution where needed, and educator review for pure sounds, consistency, and accent suitability. Existing whole-word and quiz-prompt TTS is labeled as device speech.

The learning approach references https://ies.ed.gov/ncee/wwc/PracticeGuide/21 (K–3 evidence) and https://home.oxfordowl.co.uk/phonics-videos/ (parent sound modeling). No third-party lesson text was copied. Manual checks: toddler Listen & play default, lesson choice and deep link, all five steps, letter building/removal, support disabling independent observations, partial saves and reload, parent dashboard, and optional quiz. Checks cover curriculum coverage and progress logic; educator review remains necessary before claiming instructional effectiveness.

## Learning reward planning

Keep encouragement separate from proposed token amounts. No child-facing activity creates earned GEEK or a payout claim. The grown-up planner uses stable First Words/Reading Path milestone IDs and separate local review records. First Words participation can be supported; gestures and meaningful attempts count without a print test. Reading review uses existing separate observations, not tap counts or game scores. Neither rule is a validated mastery or identity test. Reward amounts and eligibility are proposals for a future funded parent-managed service. Never add a wallet seed, signing step, automatic token promise or assumption that a restored/local record proves a payable claim.
