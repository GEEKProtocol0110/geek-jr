'use client';
import { useEffect, useState } from 'react';
import { appendBackup, newLearner, parseFamily, readFamily, writeFamily, type Family } from '@/lib/family';
const button = 'min-h-12 rounded-xl border border-teal-700 bg-white px-4 py-3 font-bold text-teal-950 disabled:opacity-40';
export default function LearnerProfiles() {
  const [family,setFamily] = useState<Family|null>(null);
  const [name,setName] = useState('');
  const [message,setMessage] = useState('');
  const [backup,setBackup] = useState<Family|null>(null);
  useEffect(() => { const frame = requestAnimationFrame(() => {
    try { setFamily(readFamily(localStorage)); } catch(error) { setMessage((error as Error).message); }
  }); return () => cancelAnimationFrame(frame); },[]);
  function save(next: Family) {
    try { writeFamily(localStorage,next); window.location.reload(); }
    catch { setMessage('This browser could not save the change. Existing saved records were not replaced.'); }
  }
  function switchLearner(id: string) {
    try { const current=readFamily(localStorage); if(!current.learners.some(child=>child.id===id)) throw new Error('Learner unavailable'); save({...current,activeId:id}); }
    catch { setMessage('The saved learner list changed. Reload this page to choose again.'); }
  }
  function add() {
    if (!family) return;
    try { const current=readFamily(localStorage); const child = newLearner(name); const next: Family = {...current,activeId:child.id,learners:[...current.learners,child]}; parseFamily(JSON.stringify(next)); save(next); }
    catch { setMessage('Use a nickname of 1–30 characters. Up to eight learners fit on this device.'); }
  }
  function download() {
    try {
      const current = readFamily(localStorage); const file = new Blob([JSON.stringify(current,null,2)],{type:'application/json'});
      const url = URL.createObjectURL(file); const link = document.createElement('a'); link.href=url; link.download=`geek-jr-backup-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url);
      setMessage('Backup prepared. Check your Downloads and keep this file private; it contains learner nicknames and observations.');
    } catch { setMessage('A backup could not be prepared. Your saved records are unchanged.'); }
  }
  async function inspect(file?: File) {
    setBackup(null); if(!file) return;
    try { if(file.size > 512000) throw new Error('Choose a Geek Jr JSON backup under 500 KB.'); setBackup(parseFamily(await file.text())); setMessage('Review the learners below before importing.'); }
    catch(error) { setMessage((error as Error).message); }
  }
  function restore() {
    if(!backup) return;
    try { const next = appendBackup(readFamily(localStorage),backup,() => newLearner('restored').id); save(next); }
    catch(error) { setMessage((error as Error).message); }
  }
  return <section className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5" aria-labelledby="learners-title">
    <h2 id="learners-title" className="text-xl font-bold text-teal-950">Each learner, their own path.</h2>
    <p className="mt-2 text-sm text-teal-900">Choose a learner before beginning an activity. Nicknames, preferences and progress stay in this browser. These profiles do not sign in or sync automatically.</p>
    {family && <><label className="mt-4 grid gap-2 font-bold text-teal-950">Current learner<select className="min-h-12 rounded-xl border bg-white px-3" value={family.activeId} onChange={event => switchLearner(event.target.value)}>{family.learners.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}</select></label>
    <p className="mt-2 text-xs text-teal-900">“My learner” preserves records saved before separate profiles were added. Switching reloads this page; finish any activity first.</p>
    <div className="mt-4 flex flex-wrap items-end gap-3"><label className="grid gap-2 font-bold text-teal-950">New learner nickname<input className="min-h-12 rounded-xl border bg-white px-3" value={name} maxLength={30} onChange={event=>setName(event.target.value)} autoComplete="off" /></label><button className={button} onClick={add} disabled={!name.trim() || family.learners.length>=8}>Add learner</button></div>
    <details className="mt-5"><summary className="min-h-12 cursor-pointer font-bold text-teal-950">Back up or restore progress</summary><p className="my-3 text-sm text-teal-900">A backup can move records to another device. Import adds restored learners and keeps existing profiles. Existing learners stay selected. An empty “My learner” placeholder is replaced by restored profiles. Files are processed on this device.</p><button className={button} onClick={download}>Download progress backup</button><label className="mt-4 grid gap-2 font-bold text-teal-950">Choose a progress backup<input type="file" accept=".json,application/json" onChange={event=>void inspect(event.target.files?.[0])} className="max-w-full text-sm" /></label>
    {backup && <div className="mt-4 rounded-xl bg-white p-4"><h3 className="font-bold">Restore these learners</h3><ul className="my-3 list-inside list-disc">{backup.learners.map(child=><li key={child.id}>{child.name} · {Object.keys(child.records).length} saved record groups</li>)}</ul><button className={button} onClick={restore}>Import as separate restored profiles</button></div>}</details></>}
    <p role="status" aria-live="polite" className="mt-3 text-sm text-teal-950">{message}</p>
  </section>;
}
