import type { ReactNode } from "react";

// Same navy background as the feed hero: grid texture and a soft violet light, static (no pointer tracking).
export function PageHero({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`relative isolate overflow-hidden bg-[#0d1c5c] text-white dark:bg-[#060a1f] ${className}`}>
      <div aria-hidden className="absolute -right-24 -top-32 -z-10 size-[520px] rounded-full bg-[#9155f6]/30 blur-3xl" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      {children}
    </section>
  );
}
