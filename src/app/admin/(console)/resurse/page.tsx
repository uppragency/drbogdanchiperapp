import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, LinkButton, PageTitle, cn } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Resurse" };

const FILTERS = [
  { key: "", label: "Toate" },
  { key: "published", label: "Publicate" },
  { key: "draft", label: "Drafturi" },
  { key: "trash", label: "Coș" },
];

export default async function ResourcesAdmin({ searchParams }: PageProps<"/admin/resurse">) {
  const sp = await searchParams;
  const status = FILTERS.find((f) => f.key === sp.status)?.key ?? "";
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80).replace(/[%,()]/g, " ");

  const supabase = await createClient();
  let query = supabase
    .from("resources")
    .select("id,title,type,status,publish_at,is_pinned,deleted_at,updated_at,categories(name),resource_tags(tag_id)")
    .order("updated_at", { ascending: false })
    .limit(200);
  query = status === "trash" ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (status === "published" || status === "draft") query = query.eq("status", status);
  if (q) query = query.ilike("title", `%${q}%`);
  const [{ data }, { count: tagTotal }] = await Promise.all([query, supabase.from("tags").select("id", { count: "exact", head: true })]);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Resurse">
        <LinkButton href="/admin/resurse/nou">Resursă nouă</LinkButton>
      </PageTitle>
      <form className="flex flex-col gap-3 sm:flex-row">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Caută după titlu" aria-label="Caută după titlu" className="h-11 flex-1 rounded-control border border-line bg-surface px-4 text-base focus:border-accent focus:outline-none" />
        <button className="h-11 rounded-control border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">Caută</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `/admin/resurse?status=${f.key}` : "/admin/resurse"} className={cn("rounded-full border px-4 py-2 text-sm font-semibold", status === f.key ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:text-ink")}>
            {f.label}
          </Link>
        ))}
      </div>
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {(data ?? []).map((r) => {
          const n = r.resource_tags.length;
          const scheduled = r.status === "published" && r.publish_at && new Date(r.publish_at) > new Date();
          return (
            <li key={r.id}>
              <Link href={`/admin/resurse/${r.id}`} className="flex flex-col gap-2 p-4 hover:bg-surface2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{r.title}</span>
                  <span className="text-sm text-muted">{(Array.isArray(r.categories) ? r.categories[0] : r.categories)?.name} · {r.type} · {n === tagTotal ? "toate grupurile" : `${n} grupuri`} · {formatDateTime(r.updated_at)}</span>
                </div>
                <div className="flex gap-2">
                  {r.is_pinned && <Badge tone="accent">Fixat</Badge>}
                  {scheduled ? <Badge tone="accent">Programat</Badge> : r.status === "draft" ? <Badge>Draft</Badge> : <Badge tone="ok">Publicat</Badge>}
                </div>
              </Link>
            </li>
          );
        })}
        {(data ?? []).length === 0 && <li className="p-6 text-sm text-muted">Nicio resursă.</li>}
      </ul>
    </div>
  );
}
