import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/texts";

export const metadata: Metadata = { title: "Colecție" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CollectionPage({ params }: PageProps<"/colectii/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: c }, { data: items }] = await Promise.all([
    supabase.from("collections").select("id,title,description").eq("id", id).maybeSingle(),
    supabase.from("collection_resources").select("position,resources(id,title,description,type,publish_at,created_at)").eq("collection_id", id).order("position"),
  ]);
  if (!c) notFound();
  type R = { id: string; title: string; description: string; type: keyof typeof t.feed.types; publish_at: string | null; created_at: string };
  const rows = ((items ?? []) as { resources: R | R[] | null }[]).map((i) => (Array.isArray(i.resources) ? i.resources[0] : i.resources)).filter((r): r is R => Boolean(r));
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Link href="/colectii" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Colecții</Link>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{c.title}</h1>
      {c.description && <p className="max-w-[65ch] text-lg text-muted">{c.description}</p>}
      <ol className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
        {rows.map((r, i) => (
          <li key={r.id}>
            <Link href={`/resurse/${r.id}`} className="flex items-center gap-4 p-5 hover:bg-surface2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-sm font-bold text-violet">{i + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-bold">{r.title}</span>
                <span className="text-sm text-muted">{t.feed.types[r.type]} · {formatDate(r.publish_at ?? r.created_at)}</span>
              </span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="p-6 text-sm text-muted">Nicio resursă disponibilă în această colecție.</li>}
      </ol>
    </div>
  );
}
