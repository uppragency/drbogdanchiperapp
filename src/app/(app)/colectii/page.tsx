import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Stack } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Colecții" };

export default async function CollectionsPage() {
  const viewer = await requireUser();
  const supabase = await createClient();
  const [{ data }, { data: views }] = await Promise.all([
    supabase.from("collections").select("id,title,description,collection_resources(resource_id,resources(id))").order("position"),
    supabase.from("resource_views").select("resource_id,completed").eq("user_id", viewer.id).eq("completed", true),
  ]);
  type C = { id: string; title: string; description: string; collection_resources: { resource_id: string; resources: { id: string } | { id: string }[] | null }[] };
  const done = new Set((views ?? []).map((v: { resource_id: string }) => v.resource_id));
  const rows = ((data ?? []) as C[])
    .map((c) => {
      const visible = c.collection_resources.filter((x) => (Array.isArray(x.resources) ? x.resources.length : x.resources));
      return { ...c, count: visible.length, finished: visible.filter((x) => done.has(x.resource_id)).length };
    })
    .filter((c) => c.count > 0);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Colecții</h1>
      <p className="max-w-[65ch] text-muted">Cursuri pe teme, cu lecțiile în ordine. Vezi doar ce este disponibil pentru grupul tău.</p>
      <ul className="grid gap-6 sm:grid-cols-2">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/colectii/${c.id}`} className="card-lift flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-6 shadow-card">
              <span className="flex size-11 items-center justify-center rounded-full bg-violet-soft text-violet"><Stack size={22} /></span>
              <span className="mt-2 text-lg font-bold leading-snug">{c.title}</span>
              {c.description && <span className="line-clamp-3 text-sm leading-relaxed text-muted">{c.description}</span>}
              <span className="mt-auto flex items-center justify-between pt-3 text-sm font-semibold text-accent">
                <span>{c.count} {c.count === 1 ? "lecție" : "lecții"}{c.finished > 0 && ` · ${c.finished} terminate`}</span>
                <ArrowRight size={16} />
              </span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="sm:col-span-2">
            <EmptyState icon={Stack} title="Nu există colecții disponibile încă" text="Colecțiile apar aici imediat ce sunt publicate pentru grupul tău." action={<Link href="/feed" className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">Înapoi la resurse</Link>} />
          </li>
        )}
      </ul>
    </div>
  );
}
