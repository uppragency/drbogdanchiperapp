// One muted colour per category. Used only for small signals (dot, line, generated cover), never for backgrounds of content.
const BY_SLUG: Record<string, string> = {
  "discutii-generale": "#313885",
  anunturi: "#b45309",
  "prezinta-te": "#0f766e",
  "intrebari-si-raspunsuri": "#1d4ed8",
  webinarii: "#be185d",
  "studyclub-studii-de-caz": "#0369a1",
  bookclub: "#4d7c0f",
  "resurse-si-formulare": "#475569",
  "aventura-pe-munte": "#15803d",
};
const FALLBACK = ["#313885", "#0f766e", "#1d4ed8", "#be185d", "#0369a1", "#4d7c0f"];

const slugify = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function categoryColor(slug?: string, label?: string): string {
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug];
  if (label && BY_SLUG[slugify(label)]) return BY_SLUG[slugify(label)];
  const key = slug ?? label ?? "x";
  const h = Array.from(key).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return FALLBACK[h % FALLBACK.length];
}
