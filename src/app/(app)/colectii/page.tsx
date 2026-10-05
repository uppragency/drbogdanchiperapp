import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Stack } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { getLocale, getTx, pick } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const tx = await getTx();
  return { title: tx("Colecții", "Collections"), description: tx("Lecțiile MentorMed grupate în colecții, ca un curs pe care îl parcurgi în ordine.", "MentorMed lessons grouped into collections, like a course you follow in order.") };
}

export default async function CollectionsPage() {
  const viewer = await requireUser();
  const tx = await getTx();
  const locale = await getLocale();
  const supabase = await createClient();
  const [{ data }, { data: views }] = await Promise.all([
    supabase.from("collections").select("id,title,title_en,description,description_en,collection_resources(resource_id,resources(id))").order("position"),
    supabase.from("resource_views").select("resource_id,completed").eq("user_id", viewer.id).eq("completed", true),
  ]);
  type C = { id: string; title: string; title_en: string | null; description: string; description_en: string | null; collection_resources: { resource_id: string; resources: { id: string } | { id: string }[] | null }[] };
  const done = new Set((views ?? []).map((v: { resource_id: string }) => v.resource_id));
  const rows = ((data ?? []) as C[])
    .map((c) => {
      const visible = c.collection_resources.filter((x) => (Array.isArray(x.resources) ? x.resources.length : x.resources));
      return { ...c, count: visible.length, finished: visible.filter((x) => done.has(x.resource_id)).length };
    })
    .filter((c) => c.count > 0);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Colecții", "Collections")}</h1>
      <p className="max-w-[65ch] text-muted">{tx("Cursuri pe teme, cu lecțiile în ordine. Vezi doar ce este disponibil pentru grupul tău.", "Courses by topic, with lessons in order. You only see what is available to your group.")}</p>
      <ul className="grid gap-6 sm:grid-cols-2">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/colectii/${c.id}`} className="card-lift flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-6 shadow-card">
              <span className="flex size-11 items-center justify-center rounded-full bg-violet-soft text-violet"><Stack size={22} /></span>
              <span className="mt-2 text-lg font-bold leading-snug">{pick(locale, c.title, c.title_en)}</span>
              {pick(locale, c.description, c.description_en) && <span className="line-clamp-3 text-sm leading-relaxed text-muted">{pick(locale, c.description, c.description_en)}</span>}
              <span className="mt-auto flex items-center justify-between pt-3 text-sm font-semibold text-accent">
                <span>{c.count} {c.count === 1 ? tx("lecție", "lesson") : tx("lecții", "lessons")}{c.finished > 0 && ` · ${c.finished} ${tx("terminate", "completed")}`}</span>
                <ArrowRight size={16} />
              </span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="sm:col-span-2">
            <EmptyState icon={Stack} title={tx("Nu există colecții disponibile încă", "No collections available yet")} text={tx("Colecțiile apar aici imediat ce sunt publicate pentru grupul tău.", "Collections appear here as soon as they are published for your group.")} action={<Link href="/feed" className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">{tx("Înapoi la resurse", "Back to resources")}</Link>} />
          </li>
        )}
      </ul>
    </div>
  );
}
