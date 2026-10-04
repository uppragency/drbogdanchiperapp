"use client";
import { useEffect, useRef, useState } from "react";

// Glass header: hairline after scrolling, slides away on scroll down, returns on scroll up.
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.max(window.scrollY, 0);
        setScrolled(y > 4);
        const delta = y - last.current;
        if (y < 120) setHidden(false);
        else if (delta > 8) setHidden(true);
        else if (delta < -8) setHidden(false);
        last.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={ref}
      data-scrolled={scrolled}
      data-hidden={hidden}
      onFocusCapture={() => setHidden(false)}
      className="site-header sticky top-0 z-40"
    >
      {children}
    </header>
  );
}
