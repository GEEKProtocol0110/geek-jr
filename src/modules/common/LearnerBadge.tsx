'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import {readFamily} from '@/lib/family';
export default function LearnerBadge() {
 const [name,setName]=useState('');
 useEffect(()=>{const frame=requestAnimationFrame(()=>{try {const f=readFamily(localStorage);setName(f.learners.find(c=>c.id===f.activeId)?.name||'');} catch {setName('Progress storage unavailable');}});return()=>cancelAnimationFrame(frame);},[]);
 return name ? <div className="bg-teal-50 px-4 py-2 text-center text-sm text-teal-950"><Link href="/parent">Learning with {name} · Change learner</Link></div> : null;
}
