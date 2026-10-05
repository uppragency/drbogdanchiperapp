import type { Metadata } from "next";
import Link from "next/link";
import { getTx } from "@/lib/i18n";
import { ROADMAP_STAGES, roadmap } from "@/lib/roadmap";

export async function generateMetadata(): Promise<Metadata> {
  const tx = await getTx();
  return {
    title: "Roadmap",
    description: tx("Ce lucrăm acum în platforma MentorMed, ce urmează și ce luăm în calcul.", "What we are working on in the MentorMed platform, what is next and what we are considering."),
  };
}

export default async function RoadmapPage() {
  const tx = await getTx();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Roadmap</h1>
      <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
        {tx("Ce lucrăm în platformă și ce urmează. Ce a fost deja livrat găsești în ", "What we are building and what comes next. What has already shipped is in ")}
        <Link href="/ce-e-nou" className="font-semibold text-violet hover:underline">{tx("Ce e nou", "What's new")}</Link>.
      </p>
      {ROADMAP_STAGES.map((s) => {
        const items = roadmap.filter((i) => i.stage === s.key);
        if (!items.length) return null;
        return (
          <section key={s.key} className="mt-12">
            <h2 className="text-xl font-bold">{tx(s.ro, s.en)}</h2>
            <p className="mt-1 text-sm text-muted">{tx(s.hint.ro, s.hint.en)}</p>
            <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
              {items.map((i) => (
                <li key={i.title.ro} className="flex flex-col gap-1 p-5">
                  <h3 className="font-bold leading-snug">{tx(i.title.ro, i.title.en)}</h3>
                  <p className="max-w-[60ch] leading-relaxed text-muted">{tx(i.text.ro, i.text.en)}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="mt-12 text-sm text-muted">
        {tx("Ai o idee sau o nevoie? Scrie-ne la ", "Have an idea or a need? Write to us at ")}
        <a href="mailto:contact@drbogdanchiper.ro" className="font-semibold text-violet hover:underline">contact@drbogdanchiper.ro</a>.
      </p>
    </div>
  );
}
