import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile('src/lib/family.ts','utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
const {FAMILY_KEY,readFamily,writeFamily,parseFamily,appendBackup,newLearner}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const data=new Map();let blocked=false;
const store={getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(blocked)throw new Error('quota');data.set(k,v);}};
const legacy={'word-1':{box:2,lastSeen:1700000000000,seenCount:3}};data.set('geekjr_first_words_v1',JSON.stringify(legacy));
const first=readFamily(store);assert.equal(first.activeId,'legacy');assert.deepEqual(first.learners[0].records.geekjr_first_words_v1,legacy);assert.equal(data.has(FAMILY_KEY),false,'Reading does not overwrite browser data');
const child=newLearner('Second learner','a'.repeat(24));first.learners.push(child);first.activeId=child.id;writeFamily(store,first);
const saved=readFamily(store);assert.equal(Object.keys(saved.learners[1].records).length,0);assert.deepEqual(saved.learners[0].records.geekjr_first_words_v1,legacy);assert.equal(data.get('geekjr_first_words_v1'),JSON.stringify(legacy));
saved.learners[1].records.geekjr_first_words_v1={'word-2':{box:1,lastSeen:1700000000001,seenCount:1}};writeFamily(store,saved);
assert.deepEqual(readFamily(store).learners[0].records.geekjr_first_words_v1,legacy,'Siblings keep separate records');
const before=data.get(FAMILY_KEY);blocked=true;assert.throws(()=>writeFamily(store,{...saved,activeId:'legacy'}));assert.equal(data.get(FAMILY_KEY),before);blocked=false;
let id=1;const imported=appendBackup(saved,parseFamily(before),()=>String(id++).padStart(24,'b'));assert.equal(imported.learners.length,4);assert.equal(imported.activeId,saved.activeId);assert.deepEqual(imported.learners.slice(0,2),saved.learners);assert.ok(imported.learners[2].name.endsWith('restored'));assert.equal(new Set(imported.learners.map(c=>c.id)).size,4);
for(const mutate of [f=>f.version=2,f=>f.activeId='missing',f=>f.learners.push(f.learners[0]),f=>f.learners[0].records.secret='private',f=>f.learners[0].records.geekjr_reading_v1={'x':{sounds:{level:'master',date:0,independentDays:[]}}},f=>f.learners[0].name='\u0000',f=>f.learners[0].records.geekjr_first_words_v1={'word-1':{box:9,lastSeen:0,seenCount:1}}]){const value=JSON.parse(before);mutate(value);assert.throws(()=>parseFamily(JSON.stringify(value)));assert.equal(data.get(FAMILY_KEY),before);}
assert.throws(()=>parseFamily('{bad'));assert.throws(()=>parseFamily(' '.repeat(512001)));assert.throws(()=>appendBackup({...saved,learners:Array.from({length:8},(_,i)=>({...child,id:i.toString(16).padStart(24,'0')}))},saved,()=>newLearner('r').id));
const poisoned=JSON.parse(before);poisoned.learners[0].records.geekjr_cards_leitner_v1=JSON.parse('{"__proto__":1}');assert.throws(()=>parseFamily(JSON.stringify(poisoned)));
data.set(FAMILY_KEY,'broken');assert.throws(()=>readFamily(store));assert.equal(data.get(FAMILY_KEY),'broken','Corrupt existing documents are not silently reset');
const empty={version:1,activeId:'legacy',learners:[{id:'legacy',name:'My learner',records:{}}]};
assert.equal(appendBackup(empty,saved,()=>newLearner('r').id).learners.length,2,'An empty default does not consume restore capacity');
console.log('Family checks passed: legacy migration, sibling separation, additive restore, malformed backups, quota failures and corrupt-record preservation.');

// Exercise the actual storage adapter, including a learner switch in another tab.
const familyURL = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
const adapterSource = (await readFile('src/lib/storage.ts','utf8')).replace("'./family'",JSON.stringify(familyURL));
const adapterJS = ts.transpileModule(adapterSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const adapter = await import(`data:text/javascript;base64,${Buffer.from(adapterJS).toString('base64')}`);
data.set(FAMILY_KEY,before);globalThis.window={localStorage:store};
assert.deepEqual(adapter.loadFromStorage('geekjr_first_words_v1',{}),saved.learners[1].records.geekjr_first_words_v1);
writeFamily(store,{...saved,activeId:'legacy'});
const nextRecord={'word-3':{box:1,lastSeen:1700000000002,seenCount:1}};
assert.equal(adapter.saveToStorage('geekjr_first_words_v1',nextRecord),true);
assert.deepEqual(readFamily(store).learners[0].records.geekjr_first_words_v1,legacy);
assert.deepEqual(readFamily(store).learners[1].records.geekjr_first_words_v1,nextRecord);
blocked=true;const stable=data.get(FAMILY_KEY);assert.equal(adapter.saveToStorage('geekjr_first_words_v1',legacy),false);assert.equal(data.get(FAMILY_KEY),stable);
delete globalThis.window;
console.log('Storage adapter keeps ongoing activity with its starting learner across tab switches.');
