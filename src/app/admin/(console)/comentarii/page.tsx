import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { removeComment } from "./actions";

export const metadata: Metadata = { title: "Comentarii" };

type Row = { id: string; body: string; author_name: string | null; created_at: string; parent_id: string | null; resource_id: string; resources: { title: string } | { title: string }[] | null };

export default async function CommentsAdmin({ searchParams }: PageProps<"/admin/comentarii">) {
  await requireStaff();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  const supabase = await createClient();
  let query = supabase.from("comments").select("id,body,author_name,created_at,parent_id,resource_id,resources(title)").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.or(`body.ilike.%${q}%,author_name.ilike.%${q}%`);
  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const titleOf = (r: Row) => (Array.isArray(r.resources) ? r.resources[0]?.title : r.resources?.title) ?? "Resursă ștearsă";
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Comentarii" />
      <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input name="q" defaultValue={q} placeholder="Caută în comentarii sau după autor" aria-label="Caută în comentarii" className="h-11 rounded-control border border-line bg-surface px-4 text-base focus:border-accent focus:outline-none" />
        <button className="h-11 rounded-control border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">Caută</button>
      </form>
      <p className="text-sm text-muted">{rows.length} comentarii, cele mai noi primele</p>
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm"><span className="font-semibold">{r.author_name || "Membru"}</span> <span className="text-muted">· {formatDateTime(r.created_at)}{r.parent_id ? " · răspuns" : ""}</span></p>
              <p className="max-w-[70ch] whitespace-pre-line break-words">{r.body}</p>
              <Link href={`/resurse/${r.resource_id}`} className="text-sm font-semibold text-accent hover:underline">{titleOf(r)}</Link>
            </div>
            <form action={removeComment}>
              <input type="hidden" name="id" value={r.id} />
              <button className="min-h-11 text-sm font-semibold text-muted hover:text-danger">Șterge</button>
            </form>
          </li>
        ))}
        {rows.length === 0 && <li className="p-6 text-sm text-muted">Niciun comentariu.</li>}
      </ul>
    </div>
  );
}
