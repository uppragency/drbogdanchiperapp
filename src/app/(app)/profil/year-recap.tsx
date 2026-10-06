import { CountUp } from "@/components/count-up";
import type { Tx } from "@/lib/i18n";

export type YearRecapData = {
  year: string;
  activeDays: number;
  completed: number;
  opened: number;
  comments: number;
  longestStreak: number;
  topCategory: string | null;
};

// "Anul tău în MentorMed": shown in December. Numbers come from the member's own activity this calendar year.
export function YearRecap({ data, tx }: { data: YearRecapData; tx: Tx }) {
  const tiles: { label: string; value: number }[] = [
    { label: tx("zile active", "active days"), value: data.activeDays },
    { label: tx("resurse terminate", "resources completed"), value: data.completed },
    { label: tx("resurse deschise", "resources opened"), value: data.opened },
    { label: tx("cea mai lungă serie, în zile", "longest streak, in days"), value: data.longestStreak },
  ];
  return (
    <section aria-labelledby="recap-title" className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0a1f5c] to-[#3b2a8f] p-6 text-white md:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{tx("Recapitulare", "Recap")} {data.year}</p>
      <h2 id="recap-title" className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{tx("Anul tău în MentorMed", "Your year in MentorMed")}</h2>
      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((x) => (
          <div key={x.label} className="flex flex-col gap-1 rounded-card bg-white/10 px-4 py-4">
            <dd className="text-3xl font-bold leading-none"><CountUp value={x.value} /></dd>
            <dt className="text-xs leading-tight text-white/75">{x.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-6 max-w-[60ch] leading-relaxed text-white/90">
        {data.topCategory
          ? tx(`Categoria ta preferată a fost ${data.topCategory}.`, `Your favourite category was ${data.topCategory}.`)
          : tx("Anul viitor te așteaptă resurse noi.", "New resources are waiting for you next year.")}
        {data.comments > 0 && " " + tx(`Ai scris ${data.comments} comentarii.`, `You wrote ${data.comments} comments.`)}
      </p>
    </section>
  );
}
