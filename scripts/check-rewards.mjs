import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const cache = new Map();
async function moduleUrl(path) {
  if (cache.has(path)) return cache.get(path);
  let source = await readFile(`src/lib/${path}.ts`, 'utf8');
  const imports = [...source.matchAll(/from ['"]\.\/([^'"]+)['"]/g)];
  for (const [, name] of imports) source = source.replaceAll(`'./${name}'`, JSON.stringify(await moduleUrl(name))).replaceAll(`"./${name}"`, JSON.stringify(await moduleUrl(name)));
  const compiled = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
  const url = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;cache.set(path,url);return url;
}
const rewards = await import(await moduleUrl('learningRewards'));
const { READING_LESSONS, READING_SKILLS, recordReading } = await import(await moduleUrl('reading'));
const { WORD_LESSONS } = await import(await moduleUrl('wordLessons'));
const { recordWordObservations } = await import(await moduleUrl('firstWords'));
const family = await import(await moduleUrl('family'));
const now = new Date(2026,9,14,12).getTime(), day = 86400000;
const blank = rewards.emptyRewardPlan();
const initial = rewards.learningMilestones({}, {}, blank, now);
assert.equal(initial.length, 20);assert.equal(new Set(initial.map(m=>m.id)).size,20);
assert.equal(initial.filter(m=>m.ready).length,0);assert.equal(rewards.rewardPlanSummary(initial).proposedGeek,'0');
assert.equal(rewards.REWARD_PROPOSAL.payoutsEnabled,false);assert.equal(rewards.REWARD_PROPOSAL.fundingVerified,false);assert.equal(rewards.REWARD_PROPOSAL.serverVerified,false);
assert.throws(()=>rewards.reviewLearningMilestone(blank,'words-play',{}, {},now));
let words = {};
for (const id of WORD_LESSONS[0].words) words[id] = recordWordObservations(undefined,{understands:'with-help'},'understands',now-day);
let milestones = rewards.learningMilestones(words, {},blank,now);
assert.equal(milestones.find(m=>m.id==='words-play').ready,true,'A supported response counts without a print or independent-speech test');
let plan = rewards.reviewLearningMilestone(blank,'words-play',words,{},now);
assert.equal(rewards.rewardPlanSummary(rewards.learningMilestones(words,{},plan,now)).proposedGeek,'100');
const repeated = rewards.reviewLearningMilestone(plan,'words-play',words,{},now+1000);
assert.deepEqual(repeated,plan,'A repeated review retains the same entry and timestamp');assert.equal(blank.reviews['words-play'],undefined,'The input is not mutated');
delete words[WORD_LESSONS[0].words[0]];
assert.equal(rewards.rewardPlanSummary(rewards.learningMilestones(words,{},plan,now)).proposedGeek,'0','Removed observations invalidate a draft review');
const futureWord = recordWordObservations(undefined,{speaks:'independent'},'speaks',now+day);words[WORD_LESSONS[0].words[0]]=futureWord;
assert.equal(rewards.learningMilestones(words,{},plan,now)[0].ready,false);
words[WORD_LESSONS[0].words[0]]=recordWordObservations(undefined,{speaks:'independent'},'speaks',now+1000);
assert.equal(rewards.learningMilestones(words,{},plan,now+2000)[0].reviewed,false,'Newer evidence needs a new review');
plan=rewards.reviewLearningMilestone(plan,'words-play',words,{},now+2000);
assert.equal(rewards.rewardPlanSummary(rewards.learningMilestones(words,{},plan,now+2000)).proposedGeek,'100','Re-review updates rather than multiplies the same amount');
const observations=Object.fromEntries(READING_SKILLS.map(s=>[s.id,'independent']));
let reading=recordReading({},READING_LESSONS[0].id,observations,now-day);
assert.equal(rewards.learningMilestones({},reading,blank,now).find(m=>m.id==='reading-satpin').ready,false);
reading=recordReading(reading,'satpin',observations,now-day+1000);
assert.equal(rewards.learningMilestones({},reading,blank,now).find(m=>m.id==='reading-satpin').ready,false,'Same-day saves do not establish two days');
reading=recordReading(reading,'satpin',observations,now);
assert.equal(rewards.learningMilestones({},reading,blank,now).find(m=>m.id==='reading-satpin').ready,true);
const readingPlan=rewards.reviewLearningMilestone(blank,'reading-satpin',{},reading,now);
assert.equal(rewards.rewardPlanSummary(rewards.learningMilestones({},reading,readingPlan,now)).proposedGeek,'100');
const helped=recordReading(reading,'satpin',{blend:'with-help'},now);
assert.equal(rewards.rewardPlanSummary(rewards.learningMilestones({},helped,readingPlan,now)).proposedGeek,'0');
for(const days of [['2026-10-14','2026-10-14'],['2026-02-30','2026-10-14'],['2026-10-14','2026-10-15']]) {
 const invalid=structuredClone(reading);invalid.satpin.blend.independentDays=days;
 assert.equal(rewards.learningMilestones({},invalid,blank,now).find(m=>m.id==='reading-satpin').ready,false,'Invalid, duplicate or future independent days do not qualify');
}
const badReview={version:1,reviews:{'words-play':{reviewedAt:now+day},'reading-unknown':{reviewedAt:now},'words-food':{reviewedAt:-1}}};
assert.deepEqual(rewards.cleanRewardPlan(badReview,now),blank);
assert.throws(()=>rewards.reviewLearningMilestone(blank,'reading-unknown',words,reading,now));

// All twenty distinct milestones cap this learner's draft at 2,000 GEEK, never a token balance.
const allWords={};for(const lesson of WORD_LESSONS)for(const id of lesson.words)allWords[id]=recordWordObservations(undefined,{understands:'independent'},'understands',now-day);
let allReading={};for(const lesson of READING_LESSONS){allReading=recordReading(allReading,lesson.id,observations,now-day);allReading=recordReading(allReading,lesson.id,observations,now);}
let allPlan=blank;for(const m of rewards.learningMilestones(allWords,allReading,blank,now))allPlan=rewards.reviewLearningMilestone(allPlan,m.id,allWords,allReading,now);
const summary=rewards.rewardPlanSummary(rewards.learningMilestones(allWords,allReading,allPlan,now));assert.equal(summary.reviewedMilestones,20);assert.equal(summary.proposedGeek,'2000');assert.equal(summary.payoutsEnabled,false);

const storeData=new Map();let blocked=false;
const store={getItem:key=>storeData.get(key)??null,setItem:(key,value)=>{if(blocked)throw new Error('Storage blocked');storeData.set(key,value);}};
const a=family.newLearner('First learner','a'.repeat(24)),b=family.newLearner('Second learner','b'.repeat(24));
a.records[rewards.REWARD_PLAN_KEY]=allPlan;a.records.geekjr_reading_v1=allReading;a.records.geekjr_first_words_v1=allWords;
const document={version:1,activeId:a.id,learners:[a,b]};family.writeFamily(store,document);
const saved=family.readFamily(store);assert.deepEqual(saved.learners[0].records[rewards.REWARD_PLAN_KEY],allPlan);assert.equal(saved.learners[1].records[rewards.REWARD_PLAN_KEY],undefined);
const backup=family.parseFamily(storeData.get(family.FAMILY_KEY));let number=1;
const restored=family.appendBackup(saved,backup,()=>String(number++).padStart(24,'c'));assert.deepEqual(restored.learners[2].records[rewards.REWARD_PLAN_KEY],allPlan);assert.equal(rewards.REWARD_PROPOSAL.serverVerified,false,'Restored browser records never establish verified rewards');
for(const bad of [{version:2,reviews:{}},{version:1,reviews:{'words-play':{reviewedAt:now,paid:true}}},JSON.parse('{"version":1,"reviews":{"__proto__":{"reviewedAt":1}}}'),{version:1,reviews:{'words-play':{reviewedAt:0}}}])assert.equal(family.validRecord(rewards.REWARD_PLAN_KEY,bad),false);
globalThis.window={localStorage:store};const adapter=await import(await moduleUrl('storage'));
adapter.loadFromStorage(rewards.REWARD_PLAN_KEY,blank);
family.writeFamily(store,{...saved,activeId:b.id});
adapter.saveToStorageOrThrow(rewards.REWARD_PLAN_KEY,readingPlan);
assert.deepEqual(family.readFamily(store).learners[0].records[rewards.REWARD_PLAN_KEY],readingPlan);assert.equal(family.readFamily(store).learners[1].records[rewards.REWARD_PLAN_KEY],undefined,'A tab switch cannot move a review to a sibling');
const before=storeData.get(family.FAMILY_KEY);blocked=true;assert.throws(()=>adapter.saveToStorageOrThrow(rewards.REWARD_PLAN_KEY,blank));assert.equal(storeData.get(family.FAMILY_KEY),before,'Blocked writes preserve all sibling data');delete globalThis.window;
console.log('Reward planning checks passed: participation, two-day reading, repeated reviews, removed/new/future evidence, bounded drafts, siblings, backup restore, tab switches and atomic storage failures. No payout authority.');
