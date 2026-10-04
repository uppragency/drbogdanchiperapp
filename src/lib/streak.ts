const TZ = "Europe/Bucharest";
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

// Today's calendar date in Romania, as YYYY-MM-DD.
export const bucharestToday = (now = new Date()) => dayFmt.format(now);

const toNum = (d: string) => Math.round(Date.parse(`${d.slice(0, 10)}T00:00:00Z`) / 86400000);

// Current streak counts consecutive days ending today or yesterday; longest is the best run ever.
export function computeStreaks(days: string[], today = bucharestToday()) {
  const nums = [...new Set(days.map(toNum))].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  nums.forEach((n, i) => {
    run = i > 0 && n === nums[i - 1] + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  });
  const set = new Set(nums);
  const t = toNum(today);
  let cursor = set.has(t) ? t : set.has(t - 1) ? t - 1 : null;
  let current = 0;
  while (cursor !== null && set.has(cursor)) {
    current++;
    cursor--;
  }
  return { current, longest, activeToday: set.has(t) };
}
