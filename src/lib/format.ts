const TZ = "Europe/Bucharest";
const tag = (locale?: string) => (locale === "en" ? "en-GB" : "ro-RO");
const dateFmts = new Map<string, Intl.DateTimeFormat>();
const dateTimeFmts = new Map<string, Intl.DateTimeFormat>();

// The optional locale ("ro" or "en") picks the language of the month names. Default stays Romanian.
export const formatDate = (iso: string | null | undefined, locale?: string) => {
  if (!iso) return "";
  const k = tag(locale);
  if (!dateFmts.has(k)) dateFmts.set(k, new Intl.DateTimeFormat(k, { dateStyle: "long", timeZone: TZ }));
  return dateFmts.get(k)!.format(new Date(iso));
};
export const formatDateTime = (iso: string | null | undefined, locale?: string) => {
  if (!iso) return "";
  const k = tag(locale);
  if (!dateTimeFmts.has(k)) dateTimeFmts.set(k, new Intl.DateTimeFormat(k, { dateStyle: "medium", timeStyle: "short", timeZone: TZ }));
  return dateTimeFmts.get(k)!.format(new Date(iso));
};

// Converts a datetime-local value typed in Romania time into an ISO string, and back.
export function localInputToIso(value: string | null | undefined) {
  if (!value) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Bucharest", timeZoneName: "longOffset" }).formatToParts(new Date(value));
  const offset = parts.find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || "+00:00";
  const iso = new Date(`${value}:00${offset === "" ? "+00:00" : offset}`);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
}

export function isoToLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
