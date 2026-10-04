import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Alert, Card, PageTitle } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Previzualizare user" };

type Row = { id: string; title: string; type: string; publish_at: string | null; created_at: string; categories: { name: string } | { name: string }[] | null };

// Shows which resources a member can see, using the same rule as the database (group overlap, published, not scheduled for later).
export default async function PreviewUser({ params }: PageProps<"/admin/useri/[id]/previzualizare">) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("id,email,first_name,last_name,is_active,access_expires_at,deleted_at,role").eq("id", id).maybeSingle();
  if (!p) notFound();
  const { data: ut } = await admin.from("user_tags").select("tag_id,tags(name)").eq("user_id", id);
  const tagIds = (ut ?? []).map((x: { tag_id: string }) => x.tag_id);
  const expired = p.access_expires_at && new Date(p.access_expires_at) < new Date();
  const hasAccess = p.is_active && !p.deleted_at && !expired;

  let rows: Row[] = [];
  if (hasAccess && tagIds.length) {
    const { data } = await admin
      .from("resources")
      .select("id,title,type,publish_at,created_at,categories(name),resource_tags!inner(tag_id)")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
      .in("resource_tags.tag_id", tagIds)
      .order("publish_at", { ascending: false, nullsFirst: false })
      .limit(300);
    rows = (data ?? []) as Row[];
  }
  const groups = (ut ?? []).map((x: { tags: { name: string } | { name: string }[] | null }) => (Array.isArray(x.tags) ? x.tags[0]?.name : x.tags?.name)).filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/admin/useri/${id}`} className="text-sm font-semibold text-muted hover:text-ink">Înapoi la user</Link>
      <PageTitle title={`Ce vede ${`${p.first_name} ${p.last_name}`.trim() || p.email}`} />
      <Card className="flex flex-col gap-1 text-sm">
        <p><span className="font-semibold">Grupuri:</span> {groups || "niciunul"}</p>
        <p><span className="font-semibold">Acces:</span> {hasAccess ? "activ" : p.deleted_at ? "cont șters" : expired ? "expirat" : "dezactivat"}</p>
      </Card>
      {!hasAccess && <Alert>Userul nu are acces activ, deci nu vede nicio resursă.</Alert>}
      {hasAccess && tagIds.length === 0 && <Alert>Userul nu are niciun grup MentorMed, deci nu vede nicio resursă.</Alert>}
      <p className="text-sm text-muted">{rows.length} resurse vizibile</p>
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/resurse/${r.id}`} className="flex flex-col gap-1 p-4 hover:bg-surface2">
              <span className="font-semibold">{r.title}</span>
              <span className="text-sm text-muted">{(Array.isArray(r.categories) ? r.categories[0] : r.categories)?.name} · {r.type} · {formatDate(r.publish_at ?? r.created_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
