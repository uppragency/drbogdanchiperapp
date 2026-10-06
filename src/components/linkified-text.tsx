import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s<>"]+)/g;
const TRAILING = /[.,;:!?)\]]+$/;

// Turns plain http(s) addresses into links that open in a new tab. Long addresses wrap instead of overflowing.
export function LinkifiedText({ text }: { text: string }): ReactNode {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const trail = part.match(TRAILING)?.[0] ?? "";
        const href = trail ? part.slice(0, -trail.length) : part;
        return (
          <span key={i}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-2 [overflow-wrap:anywhere] hover:text-accent-hover">{href}</a>
            {trail}
          </span>
        );
      })}
    </>
  );
}
