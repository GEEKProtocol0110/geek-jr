import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tiers = ["1-2", "3-4", "5-7", "8-10"];
const sources = [
  ["Phonics Tap", "src/data/phonics/sounds.json", "choices"],
  ["Patterns & Logic", "src/data/patterns/patterns.json", "choices"],
  ["Story Sequence", "src/data/stories/stories.json", "choices"],
  ["Memory Match", "src/data/memory/pairs.json", "pairs"],
];

for (const [name, file, kind] of sources) {
  const entries = JSON.parse(await readFile(file, "utf8"));
  const ids = new Set();

  for (const entry of entries) {
    assert.ok(entry.id && !ids.has(entry.id), `${name}: duplicate or missing ID ${entry.id}`);
    ids.add(entry.id);
    assert.ok(tiers.includes(entry.tier), `${name}: invalid age tier on ${entry.id}`);

    if (kind === "choices") {
      assert.ok(entry.prompt?.trim(), `${name}: missing prompt on ${entry.id}`);
      assert.equal(entry.choices?.length, 3, `${name}: expected three choices on ${entry.id}`);
      assert.equal(new Set(entry.choices).size, 3, `${name}: repeated choice on ${entry.id}`);
      assert.ok(entry.choices.includes(entry.correct), `${name}: answer is not a choice on ${entry.id}`);
    } else {
      assert.ok(entry.label?.trim() && entry.visual?.trim(), `${name}: incomplete pair ${entry.id}`);
    }
  }

  for (const tier of tiers) {
    const core = entries.filter((entry) => entry.tier === tier && !entry.pack);
    assert.ok(core.length >= 10, `${name}: ${tier} has ${core.length} items, fewer than a full round`);
  }

  console.log(`${name}: four age levels with full 10-item rounds`);
}

await import('./check-learning.mjs');

await import("./check-family.mjs");
await import("./check-rewards.mjs");
