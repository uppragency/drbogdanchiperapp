import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FilePdf, Link as LinkIcon, MagnifyingGlass, TextAlignLeft, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { Highlight } from "@/components/highlight";
import { categoryColor } from "@/lib/category-color";
import { getLocale, getT, getTx, pick } from "@/lib/i18n";
import { popularSearches } from "@/app/(app)/header-actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTx())("Căutare", "Search") };
}
const ICON = { video: VideoCamera, pdf: FilePdf, text: TextAlignLeft, link: LinkIcon } as const;

type Cat = { name: string; name_en: string | null; slug: string };
type Hit = { id: string; title: string; title_en: string | null; description: string; description_en: string | null; type: keyof typeof ICON; categories: Cat | Cat[] | null };

export default async function SearchPage({ searchParams }: PageProps<"/cauta">) {
  await requireUser();
  const [t, tx, locale] = await Promise.all([getT(), getTx(), getLocale()]);
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const needle = q.replace(/[%,()*\\]/g, " ").trim();
  let hits: Hit[] = [];
  const supabase = await createClient();
  if (needle.length >= 3) {
    // Feeds the popular searches; failures are ignored.
    try {
      await supabase.rpc("log_search", { p_term: needle });
    } catch {}
  }
  const popular = !q ? await popularSearches("").catch(() => [] as string[]) : [];
  if (needle.length >= 2) {
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("resources")
      .select("id,title,title_en,description,description_en,type,categories(name,name_en,slug)")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
      .or(`title.ilike.%${needle}%,description.ilike.%${needle}%,presenter.ilike.%${needle}%,body.ilike.%${needle}%${locale === "en" ? `,title_en.ilike.%${needle}%,description_en.ilike.%${needle}%,body_en.ilike.%${needle}%` : ""}`)
      .order("created_at", { ascending: false })
      .limit(60);
    hits = (data ?? []) as unknown as Hit[];
  }
  const cat = (h: Hit) => (Array.isArray(h.categories) ? h.categories[0] : h.categories);
  const groups = new Map<string, { name: string; slug: string; items: Hit[] }>();
  hits.forEach((h) => {
    const c = cat(h);
    const key = c?.slug ?? "altele";
    if (!groups.has(key)) groups.set(key, { name: c ? pick(locale, c.name, c.name_en) : tx("Altele", "Other"), slug: key, items: [] });
    groups.get(key)!.items.push(h);
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Căutare", "Search")}</h1>
      <form action="/cauta" role="search" className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} autoFocus={!q} placeholder={tx("Caută în toate categoriile", "Search all categories")} aria-label={tx("Caută în toate categoriile", "Search all categories")} className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-base placeholder:text-muted focus:border-accent focus:outline-none" />
        </div>
        <button type="submit" className="h-12 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover active:scale-[0.98]">{t.common.search}</button>
      </form>

      {!q && <EmptyState icon={MagnifyingGlass} title={tx("Ce cauți?", "What are you looking for?")} text={tx("Caută după titlu, descriere sau text, în toate categoriile disponibile pentru tine.", "Search by title, description or text across all categories available to you.")} />}
      {!q && popular.length > 0 && (
        <section aria-label={tx("Căutări populare", "Popular searches")} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{tx("Căutări populare", "Popular searches")}</h2>
          <ul className="flex flex-wrap gap-2">
            {popular.map((term) => (
              <li key={term}>
                <Link href={`/cauta?q=${encodeURIComponent(term)}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold transition-colors hover:bg-surface2">{term}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {q && needle.length < 2 && <EmptyState icon={MagnifyingGlass} title={tx("Scrie cel puțin 2 caractere", "Type at least 2 characters")} />}
      {needle.length >= 2 && hits.length === 0 && (
        <EmptyState
          icon={MagnifyingGlass}
          title={tx("Nu am găsit nicio resursă", "No resources found")}
          text={tx(`Nicio potrivire pentru „${q}”. Încearcă un cuvânt mai scurt sau altă formulare.`, `No matches for “${q}”. Try a shorter word or different wording.`)}
          action={<Link href="/feed" className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">{tx("Vezi toate resursele", "See all resources")}</Link>}
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
                      <span className="font-bold"><Highlight text={pick(locale, h.title, h.title_en)} q={q} /></span>
                      {pick(locale, h.description, h.description_en) && <span className="line-clamp-1 text-sm text-muted"><Highlight text={pick(locale, h.description, h.description_en)} q={q} /></span>}
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
