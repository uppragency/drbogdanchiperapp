import Link from "next/link";
import { ArrowUpRight, FilePdf, Heart, Link as LinkIcon, MagnifyingGlass, PushPin, TextAlignLeft, VideoCamera, Paperclip } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/components/ui";
import { Cover, type ResourceType } from "@/components/cover";
import { CategoryIcon } from "@/lib/category-icons";
import { t } from "@/lib/texts";
import { Hero, type HeroCard } from "./hero";
import { FeaturedRow } from "./featured-row";
import { CommunityShell } from "@/components/community-shell";

export const TYPES = ["video", "pdf", "text", "link"] as const;
function TypeIcon({ type }: { type: ResourceType }) {
  const props = { size: 18 };
  if (type === "video") return <VideoCamera {...props} />;
  if (type === "pdf") return <FilePdf {...props} />;
  if (type === "text") return <TextAlignLeft {...props} />;
  return <LinkIcon {...props} />;
}

export type Category = { id: string; name: string; slug: string };
export type Row = {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  video_url: string | null;
  is_pinned: boolean;
  publish_at: string | null;
  created_at: string;
  category_id: string;
  cover_path: string | null;
  resource_attachments: { id: string }[];
};

export type FeedViewProps = {
  firstName: string;
  groups: string[];
  categories: Category[];
  activeCategory?: Category;
  q: string;
  tip?: (typeof TYPES)[number];
  fav: boolean;
  welcomes: { name: string; message: string }[];
  featured: Row[];
  pages: number;
  filtered: boolean;
  newTotal: number;
  newByCategory: Record<string, number>;
  shown: Row[];
  totalMatching: number;
  newIds: string[];
  dates: Record<string, string>;
  covers: Record<string, string[]>;
  heroRows: Row[];
  resume: { id: string; title: string; category: string } | null;
  announcements: Row[];
};

export function FeedView(p: FeedViewProps) {
  const { firstName, groups, categories, activeCategory, q, tip, pages, filtered, newTotal, shown, announcements, heroRows } = p;
  const categorie = activeCategory?.slug ?? "";
  const catById = new Map(categories.map((c) => [c.id, c]));
  const newSet = new Set(p.newIds);
  const isNew = (r: Row) => newSet.has(r.id);
  const dateOf = (r: Row) => p.dates[r.id] ?? "";
  const covers = new Map(Object.entries(p.covers));
  const list = { length: p.totalMatching };

  const href = (patch: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    const merged: Record<string, string | undefined> = { q: q || undefined, categorie: categorie || undefined, tip, fav: p.fav ? "1" : undefined, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && usp.set(k, v));
    const s = usp.toString();
    return s ? `/feed?${s}` : "/feed";
  };

  const heroCards: HeroCard[] = heroRows.map((r) => ({
    id: r.id,
    title: r.title,
    category: catById.get(r.category_id)?.name ?? "",
    type: r.type,
    date: dateOf(r),
    covers: covers.get(r.id) ?? [],
  }));

  return (
    <>
      {!filtered && (
        <div>
          <Hero
            name={firstName}
            groups={groups}
            newCount={newTotal}
            cards={heroCards}
            resume={p.resume}
            announcements={announcements.map((a) => ({ id: a.id, title: a.title }))}
          />
        </div>
      )}

      {!filtered && p.featured.length > 0 && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-10">
          <FeaturedRow cards={p.featured.map((r) => ({ id: r.id, title: r.title, description: r.description, category: catById.get(r.category_id)?.name ?? "", type: r.type, covers: covers.get(r.id) ?? [] }))} />
        </div>
      )}

      <CommunityShell
        categories={categories}
        activeSlug={activeCategory?.slug}
        newByCategory={p.newByCategory}
        newTotal={newTotal}
        announcements={announcements.map((a) => ({ id: a.id, title: a.title, date: dateOf(a) }))}
        categoryHref={(slug) => href({ categorie: slug, pagina: undefined })}
        className={filtered ? "pt-10" : "pt-8"}
      >
        <>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{activeCategory ? activeCategory.name : t.feed.title}</h2>

          <form action="/feed" className="flex gap-2">
            {activeCategory && <input type="hidden" name="categorie" value={activeCategory.slug} />}
            {tip && <input type="hidden" name="tip" value={tip} />}
            {p.fav && <input type="hidden" name="fav" value="1" />}
            <div className="relative flex-1">
              <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input name="q" defaultValue={q} placeholder={t.feed.search} aria-label={t.feed.search} className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-base placeholder:text-muted focus:border-accent focus:outline-none" />
            </div>
            <button type="submit" className="h-12 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover active:scale-[0.98]">{t.common.search}</button>
          </form>


          {p.welcomes.length > 0 && (
            <section className="flex flex-col gap-3 rounded-card border border-line bg-violet-soft p-6">
              {p.welcomes.map((w) => (
                <div key={w.name} className="flex flex-col gap-1">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{w.name}</h2>
                  <p className="max-w-[65ch] whitespace-pre-line leading-relaxed">{w.message}</p>
                </div>
              ))}
            </section>
          )}

          <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-full bg-surface2 p-1" role="group" aria-label="Tip resursă">
            {[undefined, ...TYPES].map((x) => (
              <Link key={x ?? "all"} href={href({ tip: x, pagina: undefined })} aria-current={tip === x ? "true" : undefined} className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", tip === x ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>
                {x ? t.feed.types[x] : t.feed.all}
              </Link>
            ))}
          </div>
          <Link href={href({ fav: p.fav ? undefined : "1", pagina: undefined })} aria-pressed={p.fav} className={cn("inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors", p.fav ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:text-ink")}>
            <Heart size={18} weight={p.fav ? "fill" : "regular"} /> Favorite
          </Link>
          </div>

          {shown.length > 0 ? (
            <>
              <ul className="flex flex-col gap-6">
                {shown.map((r) => (
                  <li key={r.id}>
                    <PostCard r={r} category={catById.get(r.category_id)} isNew={isNew(r)} date={dateOf(r)} covers={covers.get(r.id) ?? []} />
                  </li>
                ))}
              </ul>
              {list.length > shown.length && (
                <Link href={href({ pagina: String(pages + 1) })} scroll={false} className="self-center rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold transition hover:bg-surface2">
                  Încarcă mai multe
                </Link>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-line p-10 text-center text-muted">
              <p>{filtered ? t.feed.emptyFiltered : t.feed.empty}</p>
              {filtered && <Link href="/feed" className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface2">Șterge filtrele</Link>}
            </div>
          )}
        </>
      </CommunityShell>
    </>
  );
}

function PostCard({ r, category, isNew, date, covers }: { r: Row; category?: Category; isNew: boolean; date: string; covers: string[] }) {
  const files = r.resource_attachments.length;
  return (
    <Link href={`/resurse/${r.id}`} className="group block overflow-hidden rounded-card border border-line bg-surface shadow-card transition hover:-translate-y-0.5">
      <div className="flex items-center gap-3 px-5 pt-5">
        <span className="flex size-11 items-center justify-center rounded-full bg-violet-soft text-violet"><CategoryIcon slug={category?.slug} size={22} weight="fill" /></span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold">{category?.name}</span>
          <span className="text-xs text-muted">{date}</span>
        </span>
        {r.is_pinned && <PushPin size={18} weight="fill" className="text-accent" aria-label="Fixată" />}
        {isNew && <span className="rounded-full bg-violet px-3 py-1 text-xs font-bold text-white">{t.feed.new}</span>}
      </div>
      <div className="flex flex-col gap-2 px-5 pb-4 pt-4">
        <h3 className="text-xl font-bold leading-snug tracking-tight">{r.title}</h3>
        {r.description && <p className="line-clamp-3 text-sm leading-relaxed text-muted">{r.description}</p>}
      </div>
      {(r.type !== "text" || covers.length > 0) && <Cover covers={covers} type={r.type} label={category?.name} play={r.type === "video"} />}
      <div className={cn("flex items-center gap-4 px-5 py-4 text-sm font-semibold text-muted", r.type === "text" && "border-t border-line")}>
        <span className="inline-flex items-center gap-2"><TypeIcon type={r.type} /> {t.feed.types[r.type]}</span>
        {files > 0 && <span className="inline-flex items-center gap-2"><Paperclip size={18} /> {files}</span>}
        <span className="ml-auto inline-flex items-center gap-1 text-accent">{t.resource.open} <ArrowUpRight size={16} weight="bold" /></span>
      </div>
    </Link>
  );
}
