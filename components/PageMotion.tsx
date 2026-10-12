"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Animate only when content enters view; content stays readable without JS.
export default function PageMotion() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/organizacion")) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const selector = ".hero-copy > *, .hero-photo, .story-copy > *, .story-image, .schedule-heading, .ceremony-details, .ceremony-countdown > div, .venue-card, .venue-photo, .quote-section > *, .quick-card, .section-shell.text-center > *, .faq-heading, .faq-content li, main > h1, main > p, main > form, .invitation-card > *";
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        if (preference.matches) return;
        const siblings = Array.from(target.parentElement?.children || []);
        const delay = Math.min(siblings.indexOf(target) * 65, 260);
        const animation = target.animate([
          { opacity: 0, translate: "0 22px" },
          { opacity: getComputedStyle(target).opacity, translate: "0 0" },
        ], { duration: 750, delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: 0.08 });
    let frame = 0;
    const scan = () => {
      frame = 0;
      document.querySelectorAll(selector).forEach(element => {
        if (!seen.has(element)) { seen.add(element); observer.observe(element); }
      });
    };
    scan();
    // Opening the cover changes search params, not the pathname. Rescan at most once per frame,
    // and only when elements were added (text updates such as the countdown are ignored).
    const changes = new MutationObserver(records => {
      if (!frame && records.some(r => Array.from(r.addedNodes).some(n => n.nodeType === Node.ELEMENT_NODE))) frame = requestAnimationFrame(scan);
    });
    changes.observe(document.body, { childList: true, subtree: true });
    const stop = () => { if (preference.matches) { animations.forEach(a => a.cancel()); animations.clear(); } };
    preference.addEventListener("change", stop);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); changes.disconnect(); animations.forEach(a => a.cancel()); preference.removeEventListener("change", stop); };
  }, [pathname]);
  return null;
}
