"use client";
import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

// Short count-up on first render. The final value is always the server-rendered text, so nothing changes without JS.
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || value < 2) return;
    const c = animate(0, value, { duration: 0.9, ease: "easeOut", onUpdate: (v) => { el.textContent = String(Math.round(v)); } });
    return () => c.stop();
  }, [value, reduce]);
  return <span ref={ref} className={className}>{value}</span>;
}
