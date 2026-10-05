import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Alert, Card, PageTitle } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { bulkTags } from "../actions";
import { SelectAll } from "./select-all";

export const metadata: Metadata = { title: "Grupuri în masă" };

export default async function BulkTagsPage({ searchParams }: PageProps<"/admin/useri/tag-uri">) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  const tag = typeof sp.tag === "string" && /^[0-9a-f-]{36}$/.test(sp.tag) ? sp.tag : "";
  const supabase = await createClient();
  const { data: tags } = await supabase.from("tags").select("id,name").order("position");
  const sel = `id,email,first_name,last_name,user_tags${tag ? "!inner" : ""}(tag_id,tags(name,position))`;
  let query = supabase.from("profiles").select(sel).eq("role", "user").is("deleted_at", null).order("last_name").limit(500);
  if (tag) query = query.eq("user_tags.tag_id", tag);
  if (q) query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  const { data } = await query;
  type Row = { id: string; email: string; first_name: string; last_name: string; user_tags: { tags: { name: string; position: number } | null }[] };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/useri" className="text-sm font-semibold text-muted hover:text-ink">Înapoi la useri</Link>
      <PageTitle title="Grupuri în masă" />
      {typeof sp.ok === "string" && <Alert kind="ok">Modificat pentru {sp.ok} useri.</Alert>}
      {sp.err && <Alert>Alege cel puțin un user și un grup.</Alert>}

      <form className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
        <input name="q" defaultValue={q} placeholder="Caută după nume sau email" aria-label="Caută" className="h-11 rounded-control border border-line bg-surface px-4 text-base focus:border-accent focus:outline-none" />
        <select name="tag" defaultValue={tag} aria-label="Filtrează după grup" className="h-11 rounded-control border border-line bg-surface px-3 text-base focus:border-accent focus:outline-none">
          <option value="">Toate grupurile</option>
          {(tags ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <button className="h-11 rounded-control border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">Filtrează</button>
      </form>

      <form action={bulkTags} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <label htmlFor="mode" className="text-sm font-semibold">Acțiune</label>
            <select id="mode" name="mode" className="h-11 rounded-control border border-line bg-bg px-3 text-base">
              <option value="add">Adaugă grupul</option>
              <option value="remove">Scoate grupul</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="tagId" className="text-sm font-semibold">Grup</label>
            <select id="tagId" name="tagId" required className="h-11 rounded-control border border-line bg-bg px-3 text-base">
              {(tags ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <SelectAll />
          <SubmitButton>Aplică la selectați</SubmitButton>
        </Card>
        <p className="text-sm text-muted">{rows.length} useri{rows.length === 500 ? " (primii 500)" : ""}</p>
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {rows.map((r) => {
            const names = r.user_tags.map((x) => x.tags).filter((x): x is { name: string; position: number } => Boolean(x)).sort((a, b) => a.position - b.position).map((x) => x.name.replace("MentorMed ", "M"));
            return (
              <li key={r.id}>
                <label className="flex min-h-14 cursor-pointer items-center gap-4 p-4 hover:bg-surface2">
                  <input type="checkbox" name="userIds" value={r.id} className="size-5 accent-[var(--accent)]" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">{`${r.first_name} ${r.last_name}`.trim() || r.email}</span>
                    <span className="truncate text-sm text-muted">{r.email} · {names.join(", ") || "Fără grup"}</span>
                  </span>
                </label>
              </li>
            );
          })}
          {rows.length === 0 && <li className="p-6 text-sm text-muted">Niciun user.</li>}
        </ul>
      </form>
    </div>
  );
}
