import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, FilePdf, Link as LinkIcon, Stack, TextAlignLeft, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EmptyState, LinkButton } from "@/components/ui";
import { categoryColor } from "@/lib/category-color";
import { getLocale, getT, getTx, pick } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/colectii/[id]">): Promise<Metadata> {
  const [tx, locale, { id }] = await Promise.all([getTx(), getLocale(), params]);
  const fallback = tx("Colecție", "Collection");
  if (!UUID.test(id)) return { title: fallback };
  const supabase = await createClient();
  const { data: c } = await supabase.from("collections").select("title,title_en,description,description_en").eq("id", id).maybeSingle();
  if (!c) return { title: fallback };
  const raw = pick(locale, c.description, c.description_en).replace(/\s+/g, " ").trim();
  const description = raw.length > 155 ? `${raw.slice(0, 152).trimEnd()}...` : raw;
  return { title: pick(locale, c.title, c.title_en), description: description || tx("Colecție de lecții MentorMed, în ordinea în care se parcurg.", "A MentorMed lesson collection, in the order to follow.") };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ICON = { video: VideoCamera, pdf: FilePdf, text: TextAlignLeft, link: LinkIcon } as const;

export default async function CollectionPage({ params }: PageProps<"/colectii/[id]">) {
  const viewer = await requireUser();
  const t = await getT();
  const tx = await getTx();
  const locale = await getLocale();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: c }, { data: items }, { data: views }] = await Promise.all([
    supabase.from("collections").select("id,title,title_en,description,description_en").eq("id", id).maybeSingle(),
    supabase.from("collection_resources").select("position,resources(id,title,title_en,description,type,publish_at,created_at,categories(name,slug))").eq("collection_id", id).order("position"),
    supabase.from("resource_views").select("resource_id,completed").eq("user_id", viewer.id),
  ]);
  if (!c) notFound();
  type R = { id: string; title: string; title_en: string | null; description: string; type: keyof typeof ICON; publish_at: string | null; created_at: string; categories: { name: string; slug: string } | { name: string; slug: string }[] | null };
  const rows = ((items ?? []) as unknown as { resources: R | R[] | null }[]).map((i) => (Array.isArray(i.resources) ? i.resources[0] : i.resources)).filter((r): r is R => Boolean(r));
  const done = new Set((views ?? []).filter((v: { completed: boolean }) => v.completed).map((v: { resource_id: string }) => v.resource_id));
  const doneCount = rows.filter((r) => done.has(r.id)).length;
  const next = rows.find((r) => !done.has(r.id)) ?? rows[0];
  const nextIndex = next ? rows.indexOf(next) : 0;
  const cta = doneCount === 0 ? tx("Începe prima lecție", "Start the first lesson") : doneCount === rows.length ? tx("Reia de la prima lecție", "Restart from the first lesson") : tx(`Continuă cu lecția ${nextIndex + 1}`, `Continue with lesson ${nextIndex + 1}`);
  const cTitle = pick(locale, c.title, c.title_en);
  const cDesc = pick(locale, c.description, c.description_en);
  const firstCat = rows[0] ? (Array.isArray(rows[0].categories) ? rows[0].categories[0] : rows[0].categories) : null;
  const color = categoryColor(firstCat?.slug, firstCat?.name);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Link href="/colectii" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> {tx("Colecții", "Collections")}</Link>

      <header className="relative overflow-hidden rounded-card p-6 text-white md:p-10" style={{ backgroundImage: `linear-gradient(135deg, ${color} 0%, #0d1c5c 130%)` }}>
        <div aria-hidden className="absolute -right-16 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <Stack size={160} weight="thin" aria-hidden className="absolute -bottom-6 -right-4 text-white/15" />
        <p className="relative text-xs font-semibold uppercase tracking-wider text-white/80">{tx("Curs", "Course")}</p>
        <h1 className="relative mt-3 max-w-[22ch] text-3xl font-bold leading-tight tracking-tight md:text-4xl">{cTitle}</h1>
        {cDesc && <p className="relative mt-3 max-w-[60ch] leading-relaxed text-white/85">{cDesc}</p>}
        <p className="relative mt-5 text-sm font-semibold text-white/85">
          {rows.length} {rows.length === 1 ? tx("lecție", "lesson") : tx("lecții", "lessons")}
          {doneCount > 0 && ` · ${doneCount} ${doneCount === 1 ? tx("terminată", "completed") : tx("terminate", "completed")}`}
        </p>
        {next && (
          <LinkButton href={`/resurse/${next.id}`} className="relative mt-6 rounded-full bg-white text-[#0d1c5c] hover:bg-white/90">
            {cta} <ArrowRight size={18} />
          </LinkButton>
        )}
      </header>

      {rows.length > 0 ? (
        <ol className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
          {rows.map((r, i) => {
            const Icon = ICON[r.type];
            const isDone = done.has(r.id);
            return (
              <li key={r.id}>
                <Link href={`/resurse/${r.id}`} className="flex items-center gap-4 p-5 transition-colors hover:bg-surface2">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isDone ? "bg-ok-bg text-ok" : "bg-violet-soft text-violet"}`}>
                    {isDone ? <CheckCircle size={22} weight="fill" aria-label={tx("Terminată", "Completed")} /> : i + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold">{pick(locale, r.title, r.title_en)}</span>
                    <span className="flex items-center gap-2 text-sm text-muted"><Icon size={16} /> {t.feed.types[r.type]} · {formatDate(r.publish_at ?? r.created_at, locale)}</span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState icon={Stack} title={tx("Nicio lecție disponibilă", "No lessons available")} text={tx("Resursele din această colecție nu sunt disponibile pentru grupul tău.", "The resources in this collection are not available to your group.")} />
      )}
    </div>
  );
}
