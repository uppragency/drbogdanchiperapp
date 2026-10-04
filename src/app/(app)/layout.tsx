import { fullName, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { SiteBanner } from "@/components/site-banner";
import { notificationCount } from "@/lib/notifications";
import { Toaster } from "@/components/toaster";
import { InstallHint } from "@/components/install-hint";
import { GuidedTour } from "@/components/guided-tour";
import { getLocale, getTx, pick } from "@/lib/i18n";

// Pages own their own width so the feed hero can run edge to edge.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireUser();
  const locale = await getLocale();
  const tx = await getTx();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase.from("site_banners").select("id,message,message_en,link_url,link_label,link_label_en,starts_at,ends_at").eq("is_active", true).order("created_at", { ascending: false }).limit(5);
  const b = (data ?? []).find((x: { starts_at: string | null; ends_at: string | null }) => (!x.starts_at || x.starts_at <= nowIso) && (!x.ends_at || x.ends_at > nowIso));
  const unread = await notificationCount(supabase, viewer.id);
  const { data: tourRow } = await supabase.from("profiles").select("tour_seen_at").eq("id", viewer.id).maybeSingle();
  const showTour = viewer.role !== "admin" && !tourRow?.tour_seen_at;
  return (
    <>
      <a href="#continut" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-3 focus:text-accent-ink">{tx("Sari la conținut", "Skip to content")}</a>
      <AppHeader isAdmin={viewer.role === "admin"} unread={unread} initials={((viewer.firstName?.[0] ?? "") + (viewer.lastName?.[0] ?? "")).toUpperCase() || viewer.email[0]?.toUpperCase() || "?"} name={fullName(viewer) || viewer.email} email={viewer.email} />
      {b && <SiteBanner banner={{ id: b.id, message: pick(locale, b.message, b.message_en), linkUrl: b.link_url, linkLabel: pick(locale, b.link_label, b.link_label_en) }} />}
      <main id="continut" className="flex-1">{children}</main>
      <InstallHint />
      {showTour && <GuidedTour />}
      <Toaster />
    </>
  );
}
