import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Field, PageTitle, TextArea, btn } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { addToCollection, deleteCollection, removeFromCollection, updateCollection } from "../actions";

export const metadata: Metadata = { title: "Editează colecția" };

export default async function EditCollection({ params }: PageProps<"/admin/colectii/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: c }, { data: items }, { data: all }] = await Promise.all([
    supabase.from("collections").select("*").eq("id", id).maybeSingle(),
    supabase.from("collection_resources").select("position,resources(id,title)").eq("collection_id", id).order("position"),
    supabase.from("resources").select("id,title").is("deleted_at", null).order("title").limit(500),
  ]);
  if (!c) notFound();
  type Item = { position: number; resources: { id: string; title: string } | { id: string; title: string }[] | null };
  const rows = ((items ?? []) as Item[]).map((i) => (Array.isArray(i.resources) ? i.resources[0] : i.resources)).filter((r): r is { id: string; title: string } => Boolean(r));
  const inSet = new Set(rows.map((r) => r.id));
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/colectii" className="text-sm font-semibold text-muted hover:text-ink">Înapoi la colecții</Link>
      <PageTitle title={c.title} />
      <Card>
        <form action={updateCollection} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={c.id} />
          <Field label="Titlu" name="title" defaultValue={c.title} required />
          <TextArea label="Descriere" name="description" defaultValue={c.description} rows={2} />
          <div><SubmitButton>Salvează</SubmitButton></div>
        </form>
      </Card>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Resurse în colecție</h2>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 py-3">
              <Link href={`/admin/resurse/${r.id}`} className="font-semibold hover:text-accent">{r.title}</Link>
              <form action={removeFromCollection}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="resourceId" value={r.id} /><button className={btn.secondary}>Scoate</button></form>
            </li>
          ))}
          {rows.length === 0 && <li className="py-3 text-sm text-muted">Colecția este goală.</li>}
        </ul>
        <form action={addToCollection} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={c.id} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label htmlFor="resourceId" className="text-sm font-semibold">Adaugă resursă</label>
            <select id="resourceId" name="resourceId" required defaultValue="" className="h-11 rounded-control border border-line bg-bg px-3 text-base">
              <option value="" disabled>Alege</option>
              {(all ?? []).filter((r) => !inSet.has(r.id)).map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <SubmitButton variant="secondary">Adaugă</SubmitButton>
        </form>
      </Card>
      <form action={deleteCollection}><input type="hidden" name="id" value={c.id} /><button className={btn.danger}>Șterge colecția</button></form>
    </div>
  );
}
