import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, ClockCounterClockwise, FilePdf, Link as LinkIcon, TextAlignLeft, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import { categoryColor } from "@/lib/category-color";
import { getLocale, getTx, pick } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const tx = await getTx();
  return { title: tx("Văzute recent", "Recently viewed"), description: tx("Resursele pe care le-ai deschis recent, ca să continui de unde ai rămas.", "The resources you opened recently, so you can continue where you left off.") };
}
const ICON = { video: VideoCamera, pdf: FilePdf, text: TextAlignLeft, link: LinkIcon } as const;
type Cat = { name: string; name_en: string | null; slug: string };
type Row = { last_viewed_at: string; completed: boolean; resources: { id: string; title: string; title_en: string | null; type: keyof typeof ICON; categories: Cat | Cat[] | null } | null };

export default async function RecentPage() {
  const viewer = await requireUser();
  const tx = await getTx();
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase
    .from("resource_views")
    .select("last_viewed_at,completed,resources(id,title,title_en,type,categories(name,name_en,slug))")
    .eq("user_id", viewer.id)
    .order("last_viewed_at", { ascending: false })
    .limit(40);
  // Resources the member can no longer see are dropped by row level security (null join).
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.resources).slice(0, 20);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Văzute recent", "Recently viewed")}</h1>
      {rows.length === 0 ? (
        <EmptyState icon={ClockCounterClockwise} title={tx("Nu ai deschis nicio resursă încă", "You have not opened any resource yet")} text={tx("Ultimele 20 de resurse deschise apar aici, ca să le regăsești repede.", "The last 20 resources you opened appear here so you can find them again quickly.")} action={<Link href="/feed" className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink hover:bg-accent-hover">{tx("Vezi resursele", "See resources")}</Link>} />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
          {rows.map((r) => {
            const res = r.resources!;
            const c = Array.isArray(res.categories) ? res.categories[0] : res.categories;
            const Icon = ICON[res.type];
            return (
              <li key={res.id}>
                <Link href={`/resurse/${res.id}`} className="flex items-center gap-4 p-5 transition-colors hover:bg-surface2">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet"><Icon size={20} /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold">{pick(locale, res.title, res.title_en)}</span>
                    <span className="flex items-center gap-2 text-sm text-muted">
                      <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(c?.slug, c?.name) }} aria-hidden /> {c ? pick(locale, c.name, c.name_en) : ""} · {formatDate(r.last_viewed_at, locale)}
                    </span>
                  </span>
                  {r.completed && <CheckCircle size={22} weight="fill" className="shrink-0 text-ok" aria-label={tx("Terminat", "Completed")} />}
                  <ArrowRight size={18} className="shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
