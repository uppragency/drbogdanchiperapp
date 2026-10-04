import Link from "next/link";
import { ArrowUpRight, CheckCircle, FilePdf, Heart, Link as LinkIcon, MagnifyingGlass, PushPin, TextAlignLeft, VideoCamera, Paperclip } from "@phosphor-icons/react/dist/ssr";
import { cn, EmptyState } from "@/components/ui";
import { categoryColor } from "@/lib/category-color";
import { FeedToolbar } from "./feed-toolbar";
import { Cover, type ResourceType } from "@/components/cover";
import { CategoryIcon } from "@/lib/category-icons";
import { t } from "@/lib/texts";
import { Hero, type HeroCard } from "./hero";
import { FeaturedRow } from "./featured-row";
import { CommunityShell } from "@/components/community-shell";

export const TYPES = ["video", "pdf", "text", "link"] as const;
export const SORTS = ["noi", "vizionate", "alfabetic"] as const;
const SORT_LABEL = { noi: "Cele mai noi", vizionate: "Cele mai vizionate", alfabetic: "Alfabetic" } as const;
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
  sort: (typeof SORTS)[number];
  view: "lista" | "grila";
  completedIds: string[];
  startHere: Row[];
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
  const doneSet = new Set(p.completedIds);

  const href = (patch: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    const merged: Record<string, string | undefined> = { q: q || undefined, categorie: categorie || undefined, tip, fav: p.fav ? "1" : undefined, sortare: p.sort === "noi" ? undefined : p.sort, vedere: p.view === "grila" ? "grila" : undefined, ...patch };
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
          <h2 className="flex items-baseline gap-3 text-2xl font-bold tracking-tight md:text-3xl">{activeCategory ? activeCategory.name : t.feed.title} <span className="text-lg font-semibold text-muted">{p.totalMatching}</span></h2>

          <FeedToolbar
            q={q}
            placeholder={t.feed.search}
            submitLabel={t.common.search}
            hidden={{ ...(activeCategory ? { categorie: activeCategory.slug } : {}), ...(tip ? { tip } : {}), ...(p.fav ? { fav: "1" } : {}), ...(p.sort !== "noi" ? { sortare: p.sort } : {}), ...(p.view === "grila" ? { vedere: "grila" } : {}) }}
            types={[undefined, ...TYPES].map((x) => ({ value: x ?? "all", label: x ? t.feed.types[x] : t.feed.all, href: href({ tip: x, pagina: undefined }), active: tip === x }))}
            sort={{ value: p.sort, options: SORTS.map((x) => ({ value: x, label: SORT_LABEL[x], href: href({ sortare: x === "noi" ? undefined : x, pagina: undefined }) })) }}
            fav={{ on: p.fav, href: href({ fav: p.fav ? undefined : "1", pagina: undefined }) }}
            chips={[
              ...(q ? [{ label: `„${q}”`, removeHref: href({ q: undefined, pagina: undefined }) }] : []),
              ...(tip ? [{ label: t.feed.types[tip], removeHref: href({ tip: undefined, pagina: undefined }) }] : []),
              ...(p.fav ? [{ label: "Favorite", removeHref: href({ fav: undefined, pagina: undefined }) }] : []),
              ...(p.sort !== "noi" ? [{ label: SORT_LABEL[p.sort], removeHref: href({ sortare: undefined, pagina: undefined }) }] : []),
            ]}
            clearHref={activeCategory ? `/feed?categorie=${activeCategory.slug}` : "/feed"}
            view={{ current: p.view, listHref: href({ vedere: undefined }), gridHref: href({ vedere: "grila" }) }}
          />


          {p.startHere.length > 0 && (
            <section aria-labelledby="incepe-aici" className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6 shadow-card">
              <h2 id="incepe-aici" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><PushPin size={18} /> Începe de aici</h2>
              <ul className="flex flex-col divide-y divide-line">
                {p.startHere.map((r) => (
                  <li key={r.id}>
                    <Link href={`/resurse/${r.id}`} className="flex min-h-11 items-center gap-3 py-3 font-semibold hover:text-accent">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(catById.get(r.category_id)?.slug, catById.get(r.category_id)?.name) }} aria-hidden />
                      <span className="min-w-0 flex-1">{r.title}</span>
                      {doneSet.has(r.id) && <CheckCircle size={20} weight="fill" className="shrink-0 text-ok" aria-label="Terminat" />}
                      <ArrowUpRight size={18} className="shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

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

          {shown.length > 0 ? (
            <>
              <ul className={cn("gap-6", p.view === "grila" ? "grid sm:grid-cols-2" : "flex flex-col")}>
                {shown.map((r) => (
                  <li key={r.id}>
                    <PostCard r={r} category={catById.get(r.category_id)} isNew={isNew(r)} done={doneSet.has(r.id)} date={dateOf(r)} covers={covers.get(r.id) ?? []} compact={p.view === "grila"} />
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
            <EmptyState
              icon={p.fav ? Heart : MagnifyingGlass}
              title={p.fav && !q ? "Nu ai resurse favorite încă" : filtered ? "Nu am găsit nicio resursă" : t.feed.empty}
              text={p.fav && !q ? "Apasă inima de pe o resursă ca să o găsești rapid aici." : filtered ? t.feed.emptyFiltered : undefined}
              action={filtered ? <Link href="/feed" className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm font-semibold transition-colors hover:bg-surface2">Șterge filtrele</Link> : undefined}
            />
          )}
        </>
      </CommunityShell>
    </>
  );
}

function PostCard({ r, category, isNew, done, date, covers, compact }: { r: Row; category?: Category; isNew: boolean; done: boolean; date: string; covers: string[]; compact: boolean }) {
  const files = r.resource_attachments.length;
  const color = categoryColor(category?.slug, category?.name);
  return (
    <Link href={`/resurse/${r.id}`} className="group card-lift flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className={cn("flex items-center gap-3 px-5", compact ? "pt-4" : "pt-5")}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet"><CategoryIcon slug={category?.slug} size={22} /></span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            <span className="truncate">{category?.name}</span>
          </span>
          <span className="text-xs text-muted">{date}</span>
        </span>
        {r.is_pinned && <PushPin size={18} weight="fill" className="text-accent" aria-label="Fixată" />}
        {done ? <CheckCircle size={22} weight="fill" className="text-ok" aria-label="Terminat" /> : isNew && <span className="rounded-full bg-violet px-3 py-1 text-xs font-bold text-on-violet">{t.feed.new}</span>}
      </div>
      <div className="flex flex-col gap-2 px-5 pb-4 pt-4">
        <h3 className={cn("font-bold leading-snug tracking-tight", compact ? "line-clamp-2 text-lg" : "text-xl")}>{r.title}</h3>
        {r.description && <p className={cn("text-sm leading-relaxed text-muted", compact ? "line-clamp-2" : "line-clamp-3")}>{r.description}</p>}
      </div>
      <Cover covers={covers} type={r.type} label={category?.name} title={r.title} slug={category?.slug} play={r.type === "video"} />
      <div className="mt-auto flex items-center gap-4 px-5 py-4 text-sm font-semibold text-muted">
        <span className="inline-flex items-center gap-2"><TypeIcon type={r.type} /> {t.feed.types[r.type]}</span>
        {files > 0 && <span className="inline-flex items-center gap-2"><Paperclip size={18} /> {files}</span>}
        <span className="ml-auto inline-flex items-center gap-1 text-accent">{t.resource.open} <ArrowUpRight size={16} weight="bold" /></span>
      </div>
    </Link>
  );
}
