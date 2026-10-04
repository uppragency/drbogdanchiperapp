import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Colecții" };

export default async function CollectionsPage() {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("id,title,description,collection_resources(resource_id,resources(id))").order("position");
  type C = { id: string; title: string; description: string; collection_resources: { resources: { id: string } | { id: string }[] | null }[] };
  const rows = ((data ?? []) as C[])
    .map((c) => ({ ...c, count: c.collection_resources.filter((x) => (Array.isArray(x.resources) ? x.resources.length : x.resources)).length }))
    .filter((c) => c.count > 0);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Colecții</h1>
      <p className="text-muted">Resurse grupate pe teme. Vezi doar ce este disponibil pentru grupul tău.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/colectii/${c.id}`} className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-6 shadow-card transition-transform hover:-translate-y-0.5">
              <span className="text-lg font-bold leading-snug">{c.title}</span>
              {c.description && <span className="line-clamp-3 text-sm text-muted">{c.description}</span>}
              <span className="mt-auto pt-2 text-sm font-semibold text-accent">{c.count} resurse</span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-card border border-dashed border-line p-10 text-center text-muted sm:col-span-2">Nu există colecții disponibile încă.</li>}
      </ul>
    </div>
  );
}
