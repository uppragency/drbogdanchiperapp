import { cn } from "@/components/ui";

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// Last 26 weeks, one cell per day, weeks as columns starting on Monday.
export function ActivityMap({ days, today, label }: { days: string[]; today: string; label: (day: string) => string }) {
  const active = new Set(days);
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -dow - 25 * 7);
  const cells = Array.from({ length: 26 * 7 }, (_, i) => addDays(start, i));
  return (
    <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
      <ol aria-hidden className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {cells.map((d) => (
          <li key={d} title={label(d)} className={cn("size-3.5 rounded-[4px]", d > today ? "opacity-0" : active.has(d) ? "bg-accent" : "bg-surface2")} />
        ))}
      </ol>
    </div>
  );
}
