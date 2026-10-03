import type { Metadata } from "next";
import Link from "next/link";
import { PushPin, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, PageTitle, btn, cn } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/texts";

export const metadata: Metadata = { title: t.feed.title };

const TYPES = ["video", "pdf", "text", "link"] as const;

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const viewer = await requireUser();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  const categorie = typeof sp.categorie === "string" ? sp.categorie : "";
  const tip = TYPES.find((x) => x === sp.tip);

  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id,name,slug").order("position");
  const activeCategory = categories?.find((c) => c.slug === categorie);

  let query = supabase
    .from("resources")
    .select("id,title,description,type,is_pinned,publish_at,created_at,categories(name,slug)")
    .eq("status", "published")
    .is("deleted_at", null)
    .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
    .order("is_pinned", { ascending: false })
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(60);
  if (activeCategory) query = query.eq("category_id", activeCategory.id);
  if (tip) query = query.eq("type", tip);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data: resources } = await query;

  const ids = (resources ?? []).map((r) => r.id);
  const { data: views } = ids.length ? await supabase.from("resource_views").select("resource_id").eq("user_id", viewer.id).in("resource_id", ids) : { data: [] };
  const seen = new Set((views ?? []).map((v) => v.resource_id));

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: q || undefined, categorie: categorie || undefined, tip: tip, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/feed?${s}` : "/feed";
  };
  const chip = (active: boolean) => cn("rounded-full border px-4 py-2 text-sm font-semibold transition", active ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:text-ink");
  const filtered = Boolean(q || activeCategory || tip);

  return (
    <div className="flex flex-col gap-8">
      <PageTitle title={t.feed.title} />

      <form action="/feed" className="flex flex-col gap-3 sm:flex-row">
        {activeCategory && <input type="hidden" name="categorie" value={activeCategory.slug} />}
        {tip && <input type="hidden" name="tip" value={tip} />}
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder={t.feed.search} aria-label={t.feed.search} className="h-11 w-full rounded-control border border-line bg-surface pl-11 pr-4 text-base placeholder:text-muted focus:border-accent focus:outline-none" />
        </div>
        <button type="submit" className={btn.secondary}>{t.common.search}</button>
      </form>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Categorii">
          <Link role="listitem" href={href({ categorie: undefined })} className={chip(!activeCategory)}>{t.feed.all}</Link>
          {categories?.map((c) => (
            <Link role="listitem" key={c.id} href={href({ categorie: c.slug })} className={cn(chip(activeCategory?.id === c.id), "whitespace-nowrap")}>{c.name}</Link>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Tip resursă">
          <Link role="listitem" href={href({ tip: undefined })} className={chip(!tip)}>{t.feed.all}</Link>
          {TYPES.map((x) => (
            <Link role="listitem" key={x} href={href({ tip: x })} className={chip(tip === x)}>{t.feed.types[x]}</Link>
          ))}
        </div>
      </div>

      {resources && resources.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {resources.map((r) => {
            const category = Array.isArray(r.categories) ? r.categories[0] : r.categories;
            const isNew = !seen.has(r.id);
            return (
              <li key={r.id}>
                <Link href={`/resurse/${r.id}`} className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-6 transition hover:border-accent">
                  <div className="flex flex-wrap items-center gap-2">
                    {isNew && <Badge tone="accent">{t.feed.new}</Badge>}
                    <Badge>{t.feed.types[r.type as keyof typeof t.feed.types]}</Badge>
                    {category && <span className="text-sm text-muted">{category.name}</span>}
                    {r.is_pinned && <PushPin size={16} weight="fill" className="ml-auto text-accent" aria-label="Fixată" />}
                  </div>
                  <h2 className="text-lg font-bold leading-snug">{r.title}</h2>
                  {r.description && <p className="line-clamp-2 text-sm text-muted">{r.description}</p>}
                  <p className="mt-auto pt-2 text-sm text-muted">{formatDate(r.publish_at ?? r.created_at)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-card border border-dashed border-line p-10 text-center text-muted">{filtered ? t.feed.emptyFiltered : t.feed.empty}</div>
      )}
    </div>
  );
}
