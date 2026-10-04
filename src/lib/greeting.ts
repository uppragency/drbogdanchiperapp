import type { Locale } from "@/lib/texts";

// Greeting by local time in Romania, computed on the server so it never differs between server and browser.
export function greetingNow(locale: Locale = "ro", now: Date = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Bucharest" }).format(now));
  const en = locale === "en";
  if (hour >= 5 && hour < 12) return en ? "Good morning" : "Bună dimineața";
  if (hour >= 12 && hour < 18) return en ? "Good afternoon" : "Bună ziua";
  if (hour >= 18 && hour < 23) return en ? "Good evening" : "Bună seara";
  return en ? "Good night" : "Noapte bună";
}
