"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DisclosureLinks() {
  const pathname = usePathname();
  useEffect(() => {
    function reveal(hash: string, focus = false) {
      let id;
      try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (!target) return;
      let node: HTMLElement | null = target;
      while (node) {
        if (node instanceof HTMLDetailsElement) node.open = true;
        node = node.parentElement;
      }
      window.requestAnimationFrame(() => {
        if (focus) {
          const destination = target instanceof HTMLDetailsElement ? target.querySelector("summary") : target;
          if (destination instanceof HTMLElement) {
            if (!destination.hasAttribute("tabindex")) destination.tabIndex = -1;
            destination.focus({ preventScroll: true });
          }
        }
        target.scrollIntoView({ block: "start", behavior: "instant" });
      });
    }
    function click(event: MouseEvent) {
      if (!(event.target instanceof Element) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank") return;
      const url = new URL(link.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash) reveal(url.hash, true);
    }
    const change = () => reveal(location.hash, true);
    if (location.hash) reveal(location.hash, true);
    document.addEventListener("click", click, true);
    window.addEventListener("hashchange", change);
    return () => { document.removeEventListener("click", click, true); window.removeEventListener("hashchange", change); };
  }, [pathname]);
  return null;
}
