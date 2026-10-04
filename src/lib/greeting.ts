// Greeting by local time in Romania, computed on the server so it never differs between server and browser.
export function greetingNow(now: Date = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Bucharest" }).format(now));
  if (hour >= 5 && hour < 12) return "Bună dimineața";
  if (hour >= 12 && hour < 18) return "Bună ziua";
  if (hour >= 18 && hour < 23) return "Bună seara";
  return "Noapte bună";
}
