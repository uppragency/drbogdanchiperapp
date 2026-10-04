import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { SiteBanner } from "@/components/site-banner";
import { notificationCount } from "@/lib/notifications";
import { Toaster } from "@/components/toaster";
import { InstallHint } from "@/components/install-hint";

// Pages own their own width so the feed hero can run edge to edge.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireUser();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase.from("site_banners").select("id,message,link_url,link_label,starts_at,ends_at").eq("is_active", true).order("created_at", { ascending: false }).limit(5);
  const b = (data ?? []).find((x: { starts_at: string | null; ends_at: string | null }) => (!x.starts_at || x.starts_at <= nowIso) && (!x.ends_at || x.ends_at > nowIso));
  const unread = await notificationCount(supabase, viewer.id);
  return (
    <>
      <a href="#continut" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-3 focus:text-accent-ink">Sari la conținut</a>
      <AppHeader isAdmin={viewer.role === "admin"} unread={unread} />
      {b && <SiteBanner banner={{ id: b.id, message: b.message, linkUrl: b.link_url, linkLabel: b.link_label }} />}
      <main id="continut" className="flex-1">{children}</main>
      <InstallHint />
      <Toaster />
    </>
  );
}
