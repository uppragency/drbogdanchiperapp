import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, LinkButton, PageTitle, cn } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Resurse" };

const TIPURI = [
  { key: "video", label: "Video" },
  { key: "pdf", label: "PDF" },
  { key: "text", label: "Text" },
  { key: "link", label: "Link" },
];
const SORTARI = [
  { key: "", label: "Modificate recent" },
  { key: "editie", label: "Ediție MentorMed" },
  { key: "tip", label: "Tip resursă" },
  { key: "titlu", label: "Titlu A-Z" },
];

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
  const tip = TIPURI.find((x) => x.key === sp.tip)?.key ?? "";
  const tag = typeof sp.editie === "string" && /^[0-9a-f-]{36}$/.test(sp.editie) ? sp.editie : "";
  const sort = SORTARI.find((x) => x.key === sp.sortare)?.key ?? "";

  const supabase = await createClient();
  const sel = `id,title,type,status,publish_at,is_pinned,deleted_at,updated_at,categories(name),resource_tags(tag_id,tags(name,position))${tag ? ",tagfilter:resource_tags!inner(tag_id)" : ""}`;
  let query = supabase.from("resources").select(sel).order("updated_at", { ascending: false }).limit(300);
  query = status === "trash" ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (status === "published" || status === "draft") query = query.eq("status", status);
  if (q) query = query.ilike("title", `%${q}%`);
  if (tip) query = query.eq("type", tip);
  if (tag) query = query.eq("tagfilter.tag_id", tag);
  const [{ data: raw }, { data: tags }] = await Promise.all([query, supabase.from("tags").select("id,name").order("position")]);
  const tagTotal = (tags ?? []).length;

  type Row = { id: string; title: string; type: string; status: string; publish_at: string | null; is_pinned: boolean; updated_at: string; categories: { name: string } | { name: string }[] | null; resource_tags: { tag_id: string; tags: { name: string; position: number } | null }[] };
  const rows = (raw ?? []) as unknown as Row[];
  const firstTag = (r: Row) => Math.min(99, ...r.resource_tags.map((x) => x.tags?.position ?? 99));
  const typeOrder = (t: string) => TIPURI.findIndex((x) => x.key === t);
  if (sort === "editie") rows.sort((a, b) => firstTag(a) - firstTag(b) || a.title.localeCompare(b.title, "ro"));
  if (sort === "tip") rows.sort((a, b) => typeOrder(a.type) - typeOrder(b.type) || a.title.localeCompare(b.title, "ro"));
  if (sort === "titlu") rows.sort((a, b) => a.title.localeCompare(b.title, "ro"));
  const editionLabel = (r: Row) => {
    const n = r.resource_tags.length;
    if (n === tagTotal && n > 0) return "toate edițiile";
    const names = r.resource_tags.map((x) => x.tags).filter((x): x is { name: string; position: number } => Boolean(x)).sort((a, b) => a.position - b.position).map((x) => x.name.replace("MentorMed ", "M"));
    return names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", ") || "fără ediție";
  };
  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    Object.entries({ status, q, tip, editie: tag, sortare: sort, ...patch }).forEach(([k, v]) => v && p.set(k, v));
    const str = p.toString();
    return str ? `/admin/resurse?${str}` : "/admin/resurse";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Resurse">
        <LinkButton href="/admin/resurse/nou">Resursă nouă</LinkButton>
      </PageTitle>
      <form className="flex flex-col gap-3 lg:flex-row">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Caută după titlu" aria-label="Caută după titlu" className="h-11 flex-1 rounded-control border border-line bg-surface px-4 text-base focus:border-accent focus:outline-none" />
        <select name="editie" defaultValue={tag} aria-label="Ediție MentorMed" className="h-11 rounded-control border border-line bg-surface px-3 text-base focus:border-accent focus:outline-none">
          <option value="">Toate edițiile</option>
          {(tags ?? []).map((x: { id: string; name: string }) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select name="tip" defaultValue={tip} aria-label="Tip resursă" className="h-11 rounded-control border border-line bg-surface px-3 text-base focus:border-accent focus:outline-none">
          <option value="">Toate tipurile</option>
          {TIPURI.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
        </select>
        <select name="sortare" defaultValue={sort} aria-label="Sortare" className="h-11 rounded-control border border-line bg-surface px-3 text-base focus:border-accent focus:outline-none">
          {SORTARI.map((x) => <option key={x.key} value={x.key}>Sortare: {x.label}</option>)}
        </select>
        <button className="h-11 rounded-control border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">Aplică</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={href({ status: f.key })} className={cn("rounded-full border px-4 py-2 text-sm font-semibold", status === f.key ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:text-ink")}>
            {f.label}
          </Link>
        ))}
      </div>
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {rows.map((r) => {
          const scheduled = r.status === "published" && r.publish_at && new Date(r.publish_at) > new Date();
          return (
            <li key={r.id}>
              <Link href={`/admin/resurse/${r.id}`} className="flex flex-col gap-2 p-4 hover:bg-surface2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{r.title}</span>
                  <span className="text-sm text-muted">{(Array.isArray(r.categories) ? r.categories[0] : r.categories)?.name} · {r.type} · {editionLabel(r)} · {formatDateTime(r.updated_at)}</span>
                </div>
                <div className="flex gap-2">
                  {r.is_pinned && <Badge tone="accent">Fixat</Badge>}
                  {scheduled ? <Badge tone="accent">Programat</Badge> : r.status === "draft" ? <Badge>Draft</Badge> : <Badge tone="ok">Publicat</Badge>}
                </div>
              </Link>
            </li>
          );
        })}
        {rows.length === 0 && <li className="p-6 text-sm text-muted">Nicio resursă.</li>}
      </ul>
    </div>
  );
}
