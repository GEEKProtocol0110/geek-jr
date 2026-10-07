![Geek Jr — Curiosity starts here](public/geek-jr-banner.svg)

**[Play Geek Jr](https://geekjr.xyz/)** · [Deployment status](https://github.com/GEEKProtocol0110/geek-jr/actions/workflows/pages.yml)

The site is deployed with GitHub Pages at `geekjr.xyz`. The workflow uses the repository Actions variable `GEEK_JR_CUSTOM_DOMAIN=geekjr.xyz` to build root-relative routes and assets for the custom domain. See [GitHub's custom domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).


<p align="center"><strong>Curiosity starts here.</strong><br/>Six focused learning activities for children ages 1–10, from Geek Protocol.</p>


<p align="center">
  <a href="https://github.com/GEEKProtocol0110/geek-jr/actions/workflows/ci.yml"><img src="https://github.com/GEEKProtocol0110/geek-jr/actions/workflows/ci.yml/badge.svg" alt="Build status"/></a>
  <img src="https://img.shields.io/badge/Next.js-16-101820" alt="Next.js 16"/>
  <img src="https://img.shields.io/badge/Ages-1%E2%80%9310-228d74" alt="Ages 1 through 10"/>
</p>


Geek Jr turns short practice sessions into a simple learning habit. Families see one suggested activity for their age level, with two alternatives and the full library available when wanted. The **For grown-ups** page keeps round length and learning level up front; optional preferences and observation records open on demand. Children can begin without an account.


## Activities


| Activity | What happens |
| --- | --- |
| **Picture Cards** | See a picture or prompt, hear a word, and mark it “Got it” or “Try it again” |
| **Reading Path** | Parent sound play, eight guided sound-to-reading lessons, spelling, connected text, and optional letter/word quiz |
| **Memory Match** | Match visible picture pairs for toddlers; flip cards for older learners |
| **Patterns & Logic** | Choose what comes next |
| **Story Sequence** | Complete a short sequence; optional Bible story questions |
| **First Words** | Practice 112 parent-guided word cards and browse the deck; reviews use five spaced practice boxes |


Content is organized into four age ranges: **1–2**, **3–4**, **5–7**, and **8–10**. The youngest range has visual prompts and no timer. This is a starter library, not a complete curriculum; parental guidance is recommended, especially for children who are not reading yet.

The optional letter/word quiz, Patterns & Logic, and Story Sequence each have ten core questions per age range, so the 3, 5, and 10 question round settings have enough content. Memory Match has ten pairs per range. Optional Bible story questions add one further Story Sequence prompt per range.


## Run the app


Use Node.js 20.9 or newer.


```bash
npm ci
npm run dev
```


Open `http://localhost:3000`. The home page links to every activity and to **Parent settings**.


```bash
npm run lint
npm run check:content
npm run build
```


The same checks run in [GitHub Actions](.github/workflows/ci.yml) for pull requests and pushes to `main`.


## How it works


```text
src/app/         Next.js pages and site layout
src/modules/     Picture cards and activity games
src/data/        Age-tiered starter content in JSON
src/lib/         Shared settings, types, and browser storage
public/         Brand artwork and icon
```


Parent settings control age range, round length, time limit for older learners, and whether Bible story questions appear. Preferences and progress are saved in this browser only; they do not sync between devices. See [privacy and storage](docs/PRIVACY.md) for details.


Browser speech synthesis reads card words and activity prompts. Pronunciation and voice availability depend on the device. Bible story content is off by default and currently includes one starter question per age range.

The First Words deck was adapted from [geek-jr-indexcards](https://github.com/GEEKProtocol0110/geek-jr-indexcards). Its optional image paths were excluded because the referenced files are not in that repository; the original text and prompts are preserved, with 20 original illustrations now added to the concrete starter lessons. Progress is stored separately from Picture Cards.


## Contribute


Start with [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and [content guidelines](docs/CONTENT_GUIDELINES.md) before adding learning prompts. Keep questions clear, age appropriate, and verifiable.

## Parent-guided First Words

Six small themed lessons connect 20 illustrated concrete words to naming, gestures, early speech, and real-world play. The original 112-card word deck remains available, with links to start a category or an individual word. Ages 1–2 default to the concrete words and up to three cards. Parents may choose another category to match their child's readiness.

Parent observations distinguish understanding, saying/attempting a word, and optional print recognition. They are stored locally; old practice marks do not become skill claims. Print focus hides pictures, and spoken hints prevent an independent mark for that attempt. Familiar word recognition is not the same as decoding new words.

Reviews show due words before new ones without filling rounds with future reviews. An explicit extra-practice action allows early repetition. All ages can choose no timer; ages 1–2 always use no timer and visible-picture matching. Multiple-choice answers are shuffled within each question, with first-try results shown separately.

`npm run check:content` covers the activity datasets plus answer shuffling, review intervals, observation independence, legacy-progress preservation, and lesson illustration coverage. The parent dashboard shows the latest observations and a recent-word table. No account or microphone is needed.

## Guided Reading Path

The existing `/phonics` route now starts with a parent-guided reading path. Ages 1–2 begin in Listen & play: noticing sounds, turn-taking, songs, and real-world language. Parents can deliberately choose Letters & words at any age when ready. The eight original starter lessons introduce `s a t p i n`, then `m d`, `o g c k`, `e r`, `u h b`, `f l`, `j v w`, and `y z x`. They cover 25 single letters and five short vowels; x represents two sounds. This is a starter sequence, not a complete phonics curriculum.

Each lesson includes parent pronunciation cues, guided blending, letter building from a dictated word, short text using already introduced letters, a comprehension discussion, and an unused practice-list word for a fresh decoding observation. The helper word `a` is explicitly introduced separately before it appears in text. The first lessons use brief lines; later ones use two linked sentences.

Four skills have separate parent observations: letter sounds, fresh-word blending, spelling, and reading with understanding. Independent observations on two different days guide review suggestions; same-day saves cannot inflate that count. A need for help resets only that skill's count. This is a practice rule, not a validated mastery test. Saved observations are local, shared on the device, and shown in Parent settings; quiz scores never become reading evidence. Parents may choose any lesson regardless of suggestions. The site explains when browser storage cannot save a reading observation.

There is no device phoneme playback or hosted professional phonics audio in this path. Parent modeling is supported by an outbound link to [Oxford Owl's teacher pronunciation and blending videos](https://home.oxfordowl.co.uk/phonics-videos/); no third-party video is embedded or loaded automatically, and no recording is copied. The old synthetic pseudo-phoneme quiz choices have been replaced with letter/word questions. The optional quiz retains its prior storage key. Licensed, educator-reviewed recordings remain a future requirement.

The lesson approach draws on the [IES K–3 foundational reading guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/21): linking sounds to print, decoding and writing, and connected text. That evidence concerns kindergarten–grade 3, not independent reading at age one. Geek Jr's new lessons have not been validated in a learning trial. Content checks verify taught-letter coverage, helper words, transfer-word separation, pronunciation cue coverage, and progress rules.
