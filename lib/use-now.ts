"use client";
import { useSyncExternalStore } from "react";

// A shared one-second clock. The server snapshot is null, so countdowns render "—" until hydrated.
let now: number | null = null;
let timer = 0;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    timer = window.setInterval(() => { now = Date.now(); listeners.forEach(l => l()); }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { window.clearInterval(timer); now = null; }
  };
}
export const useNow = () => useSyncExternalStore(subscribe, () => now, () => null);
