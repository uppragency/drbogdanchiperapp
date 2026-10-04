import type { ReactNode } from "react";

const strip = (c: string) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Marks every occurrence of the search term. Matches ignore case and Romanian diacritics (ăâîșț).
export function Highlight({ text, q }: { text: string; q?: string }): ReactNode {
  const needle = q ? Array.from(q.trim()).map(strip).join("") : "";
  if (needle.length < 2) return text;
  const chars = Array.from(text);
  let hay = "";
  const owner: number[] = [];
  chars.forEach((c, i) => {
    const s = strip(c);
    for (let k = 0; k < s.length; k++) owner.push(i);
    hay += s;
  });
  const hits: [number, number][] = [];
  let from = 0;
  for (;;) {
    const at = hay.indexOf(needle, from);
    if (at < 0) break;
    hits.push([owner[at], owner[at + needle.length - 1] + 1]);
    from = at + needle.length;
  }
  if (hits.length === 0) return text;
  const out: ReactNode[] = [];
  let cursor = 0;
  hits.forEach(([a, b], n) => {
    if (a < cursor) return;
    if (a > cursor) out.push(chars.slice(cursor, a).join(""));
    out.push(<mark key={n} className="rounded bg-violet-soft px-0.5 font-bold text-inherit">{chars.slice(a, b).join("")}</mark>);
    cursor = b;
  });
  if (cursor < chars.length) out.push(chars.slice(cursor).join(""));
  return <>{out}</>;
}
