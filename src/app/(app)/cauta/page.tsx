import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FilePdf, Link as LinkIcon, MagnifyingGlass, TextAlignLeft, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { Highlight } from "@/components/highlight";
import { categoryColor } from "@/lib/category-color";
import { t } from "@/lib/texts";

export const metadata: Metadata = { title: "Căutare" };
const ICON = { video: VideoCamera, pdf: FilePdf, text: TextAlignLeft, link: LinkIcon } as const;

type Hit = { id: string; title: string; description: string; type: keyof typeof ICON; categories: { name: string; slug: string } | { name: string; slug: string }[] | null };

export default async function SearchPage({ searchParams }: PageProps<"/cauta">) {
  await requireUser();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const needle = q.replace(/[%,()*\\]/g, " ").trim();
  let hits: Hit[] = [];
  if (needle.length >= 2) {
    const supabase = await createClient();
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("resources")
      .select("id,title,description,type,categories(name,slug)")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
      .or(`title.ilike.%${needle}%,description.ilike.%${needle}%,presenter.ilike.%${needle}%,body.ilike.%${needle}%`)
      .order("created_at", { ascending: false })
      .limit(60);
    hits = (data ?? []) as unknown as Hit[];
  }
  const cat = (h: Hit) => (Array.isArray(h.categories) ? h.categories[0] : h.categories);
  const groups = new Map<string, { name: string; slug: string; items: Hit[] }>();
  hits.forEach((h) => {
    const c = cat(h);
    const key = c?.slug ?? "altele";
    if (!groups.has(key)) groups.set(key, { name: c?.name ?? "Altele", slug: key, items: [] });
    groups.get(key)!.items.push(h);
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Căutare</h1>
      <form action="/cauta" role="search" className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} autoFocus={!q} placeholder="Caută în toate categoriile" aria-label="Caută în toate categoriile" className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-base placeholder:text-muted focus:border-accent focus:outline-none" />
        </div>
        <button type="submit" className="h-12 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover active:scale-[0.98]">{t.common.search}</button>
      </form>

      {!q && <EmptyState icon={MagnifyingGlass} title="Ce cauți?" text="Caută după titlu, descriere sau text, în toate categoriile disponibile pentru tine." />}
      {q && needle.length < 2 && <EmptyState icon={MagnifyingGlass} title="Scrie cel puțin 2 caractere" />}
      {needle.length >= 2 && hits.length === 0 && (
        <EmptyState
          icon={MagnifyingGlass}
          title="Nu am găsit nicio resursă"
          text={`Nicio potrivire pentru „${q}”. Încearcă un cuvânt mai scurt sau altă formulare.`}
          action={<Link href="/feed" className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">Vezi toate resursele</Link>}
        />
      )}

      {[...groups.values()].map((g) => (
        <section key={g.slug} aria-label={g.name} className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
            <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(g.slug, g.name) }} aria-hidden />
            {g.name} <span className="font-semibold">{g.items.length}</span>
          </h2>
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
            {g.items.map((h) => {
              const Icon = ICON[h.type];
              return (
                <li key={h.id}>
                  <Link href={`/resurse/${h.id}`} className="flex items-center gap-4 p-5 transition-colors hover:bg-surface2">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet"><Icon size={20} /></span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-bold"><Highlight text={h.title} q={q} /></span>
                      {h.description && <span className="line-clamp-1 text-sm text-muted"><Highlight text={h.description} q={q} /></span>}
                    </span>
                    <ArrowRight size={18} className="shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
