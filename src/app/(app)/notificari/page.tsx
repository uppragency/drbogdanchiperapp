import type { Metadata } from "next";
import Link from "next/link";
import { Bell, ChatsCircle, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import { getLocale, getTx, pick } from "@/lib/i18n";
import { followedCategoryIds } from "@/lib/notifications";
import { MarkSeen } from "./mark-seen";

export async function generateMetadata(): Promise<Metadata> {
  const tx = await getTx();
  return { title: tx("Notificări", "Notifications"), description: tx("Resursele noi, răspunsurile la comentarii și anunțurile din platformă.", "New resources, replies to your comments and announcements from the platform.") };
}

export default async function NotificationsPage() {
  const viewer = await requireUser();
  const tx = await getTx();
  const locale = await getLocale();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: prof } = await supabase.from("profiles").select("notifications_seen_at").eq("id", viewer.id).maybeSingle();
  const seen = (prof?.notifications_seen_at as string | undefined) ?? now;

  const followed = await followedCategoryIds(supabase, viewer.id);
  let freshQuery = supabase
    .from("resources")
    .select("id,title,title_en,publish_at,created_at,categories(name,name_en)")
    .eq("status", "published")
    .is("deleted_at", null)
    .or(`and(publish_at.is.null,created_at.gt.${seen}),and(publish_at.gt.${seen},publish_at.lte.${now})`);
  if (followed.length > 0) freshQuery = freshQuery.in("category_id", followed);
  const [{ data: replies }, { data: fresh }] = await Promise.all([
    supabase.from("notifications").select("id,resource_id,message,created_at,read_at").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(30),
    freshQuery.order("created_at", { ascending: false }).limit(20),
  ]);
  type Reply = { id: string; resource_id: string; message: string; created_at: string; read_at: string | null };
  type Cat = { name: string; name_en: string | null };
  type Fresh = { id: string; title: string; title_en: string | null; publish_at: string | null; created_at: string; categories: Cat | Cat[] | null };
  const replyRows = (replies ?? []) as Reply[];
  const freshRows = (fresh ?? []) as unknown as Fresh[];
  const unread = replyRows.filter((r) => !r.read_at).length + freshRows.length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <MarkSeen needed={unread > 0} />
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Notificări", "Notifications")}</h1>
      <p className="-mt-2 text-sm text-muted">
        {followed.length > 0
          ? tx(`Primești resurse noi doar din cele ${followed.length} categorii urmărite.`, `You get new resources only from the ${followed.length} categories you follow.`)
          : tx("Primești resurse noi din toate categoriile.", "You get new resources from all categories.")}{" "}
        <Link href="/profil" className="font-semibold text-accent hover:underline">{tx("Schimbă în profil", "Change in profile")}</Link>
      </p>
      {replyRows.length === 0 && freshRows.length === 0 ? (
        <EmptyState icon={Bell} title={tx("Nu ai notificări", "No notifications")} text={tx("Aici apar răspunsurile la comentariile tale și resursele noi publicate pentru tine.", "Replies to your comments and newly published resources for you appear here.")} action={<Link href="/feed" className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">{tx("Înapoi la resurse", "Back to resources")}</Link>} />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
          {freshRows.map((r) => {
            const c = Array.isArray(r.categories) ? r.categories[0] : r.categories;
            return (
              <li key={`f-${r.id}`}>
                <Link href={`/resurse/${r.id}`} className="flex items-center gap-4 bg-violet-soft/60 p-5 transition-colors hover:bg-violet-soft">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet"><Sparkle size={20} /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold">{tx("Resursă nouă", "New resource")}: {pick(locale, r.title, r.title_en)}</span>
                    <span className="text-sm text-muted">{c ? pick(locale, c.name, c.name_en) : ""} · {formatDate(r.publish_at ?? r.created_at, locale)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
          {replyRows.map((r) => (
            <li key={r.id}>
              <Link href={`/resurse/${r.resource_id}#comentarii`} className={`flex items-center gap-4 p-5 transition-colors hover:bg-surface2 ${r.read_at ? "" : "bg-violet-soft/60"}`}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet"><ChatsCircle size={20} /></span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{r.message}</span>
                  <span className="text-sm text-muted">{formatDate(r.created_at, locale)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
