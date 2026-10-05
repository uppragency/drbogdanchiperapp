import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, LinkButton, PageTitle } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { CountUp } from "@/components/count-up";

export const metadata: Metadata = { title: "Administrare" };

export default async function AdminHome() {
  const supabase = await createClient();
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 86400000).toISOString();
  const ago30 = new Date(now.getTime() - 30 * 86400000).toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);

  const [users, published, drafts, pending, expiring, inactive, recent, brokenLinks] = await Promise.all([
    count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user").is("deleted_at", null)),
    count(supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "published").is("deleted_at", null)),
    count(supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "draft").is("deleted_at", null)),
    count(supabase.from("invitations").select("id", { count: "exact", head: true }).is("accepted_at", null)),
    count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user").is("deleted_at", null).not("access_expires_at", "is", null).lte("access_expires_at", in14)),
    count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user").is("deleted_at", null).eq("is_active", true).or(`last_login_at.is.null,last_login_at.lt.${ago30}`)),
    supabase.from("resources").select("id,title,status,updated_at").is("deleted_at", null).order("updated_at", { ascending: false }).limit(6),
    count(supabase.from("link_checks").select("resource_id", { count: "exact", head: true }).eq("ok", false)),
  ]);

  const stats = [
    { label: "Useri activi", value: users, href: "/admin/useri" },
    { label: "Resurse publicate", value: published, href: "/admin/resurse?status=published" },
    { label: "Drafturi", value: drafts, href: "/admin/resurse?status=draft" },
    { label: "Invitații neacceptate", value: pending, href: "/admin/invitatii" },
    { label: "Acces expiră în 14 zile", value: expiring, href: "/admin/useri?stare=expira" },
    { label: "Fără logare în 30 de zile", value: inactive, href: "/admin/useri?stare=inactiv" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageTitle title="Administrare">
        <LinkButton href="/admin/resurse/nou">Resursă nouă</LinkButton>
      </PageTitle>
      {brokenLinks > 0 && (
        <Link href="/admin/linkuri" className="text-sm font-semibold text-danger hover:underline">{brokenLinks} linkuri cu probleme, vezi detaliile</Link>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-card border border-line bg-surface p-5 transition hover:shadow-card">
            <p className="text-3xl font-bold tracking-tight"><CountUp value={s.value} /></p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Ultimele modificări</h2>
        <ul className="divide-y divide-line">
          {(recent.data ?? []).map((r) => (
            <li key={r.id}>
              <Link href={`/admin/resurse/${r.id}`} className="flex items-center justify-between gap-4 py-3 text-sm hover:text-accent">
                <span className="font-semibold">{r.title}</span>
                <span className="text-muted">{r.status === "draft" ? "Draft · " : ""}{formatDateTime(r.updated_at)}</span>
              </Link>
            </li>
          ))}
          {(recent.data ?? []).length === 0 && <li className="py-3 text-sm text-muted">Nicio resursă încă.</li>}
        </ul>
      </Card>
    </div>
  );
}
