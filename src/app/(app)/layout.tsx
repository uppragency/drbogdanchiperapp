import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { SiteBanner } from "@/components/site-banner";

// Pages own their own width so the feed hero can run edge to edge.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireUser();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase.from("site_banners").select("id,message,link_url,link_label,starts_at,ends_at").eq("is_active", true).order("created_at", { ascending: false }).limit(5);
  const b = (data ?? []).find((x: { starts_at: string | null; ends_at: string | null }) => (!x.starts_at || x.starts_at <= nowIso) && (!x.ends_at || x.ends_at > nowIso));
  return (
    <>
      <AppHeader isAdmin={viewer.role === "admin"} active="feed" />
      {b && <SiteBanner banner={{ id: b.id, message: b.message, linkUrl: b.link_url, linkLabel: b.link_label }} />}
      <main className="flex-1">{children}</main>
    </>
  );
}
