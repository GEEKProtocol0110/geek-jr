import type { ReactNode } from "react";

export default function ActivityIcon({ href }: { href: string }) {
  let drawing: ReactNode;
  switch (href) {
    case "/cards": drawing = <><rect x="4" y="5" width="24" height="22" rx="4" /><circle cx="11" cy="12" r="2" /><path d="m5 24 8-8 5 5 4-4 5 7" /></>; break;
    case "/phonics": drawing = <><path d="M4 25 11 7l7 18M7 18h8M22 9v16M22 12c8-4 8 9 0 6" /></>; break;
    case "/memory": drawing = <><rect x="3" y="7" width="11" height="18" rx="3" /><rect x="18" y="7" width="11" height="18" rx="3" /><path d="m6 16 3-3 3 3-3 3zm15 0 3-3 3 3-3 3z" /></>; break;
    case "/patterns": drawing = <><circle cx="8" cy="10" r="4" /><rect x="20" y="6" width="8" height="8" rx="1" /><circle cx="8" cy="24" r="4" /><path d="m20 24 4-4 4 4-4 4z" /></>; break;
    case "/stories": drawing = <><path d="M16 8C11 4 7 5 3 7v20c4-2 8-3 13 1 5-4 9-3 13-1V7c-4-2-8-3-13 1ZM16 8v20M7 12l5 1M20 13l5-1M7 18l5 1M20 19l5-1" /></>; break;
    default: drawing = <><path d="M27 20c2-3 2-10-1-13S8 3 5 7s-3 12 1 15h3l-2 6 9-6h6" /><circle cx="10" cy="14" r="1" /><circle cx="16" cy="14" r="1" /><circle cx="22" cy="14" r="1" /></>;
  }
  return <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawing}</svg>;
}
