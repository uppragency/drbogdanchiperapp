"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Alert, Badge, btn } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { bulkResources } from "./actions";
import type { FormState } from "@/app/login/actions";

export type BulkRow = { id: string; title: string; meta: string; updatedAt: string; pinned: boolean; state: "scheduled" | "draft" | "published" };

export function BulkList({ rows, categories, selectable }: { rows: BulkRow[]; categories: { id: string; name: string }[]; selectable: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await bulkResources(prev, fd);
    if (!res.error) setSelected([]);
    setConfirmTrash(false);
    return res;
  }, {});
  const allOnPage = rows.length > 0 && selected.length === rows.length;
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      {selectable && selected.length > 0 && (
        <div className="sticky top-2 z-10 flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
          <p className="text-sm font-semibold">{selected.length} selectate</p>
          {confirmTrash ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm">Muți {selected.length} resurse în coș? Le poți restaura din Coș.</p>
              <button name="op" value="trash" className={btn.danger}>Da, mută în coș</button>
              <button type="button" onClick={() => setConfirmTrash(false)} className={btn.secondary}>Renunță</button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button name="op" value="publish" className={btn.primary}>Publică</button>
              <button name="op" value="draft" className={btn.secondary}>Retrage</button>
              <select name="categoryId" aria-label="Categorie" defaultValue="" className="h-11 rounded-control border border-line bg-bg px-3 text-base focus:border-accent focus:outline-none">
                <option value="" disabled>Categorie</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button name="op" value="move" className={btn.secondary}>Mută în categoria</button>
              <button type="button" onClick={() => setConfirmTrash(true)} className={btn.danger}>Mută în coș</button>
            </div>
          )}
        </div>
      )}
      {selectable && rows.length > 0 && (
        <label className="flex min-h-11 items-center gap-3 px-1 text-sm font-semibold">
          <input type="checkbox" checked={allOnPage} onChange={() => setSelected(allOnPage ? [] : rows.map((r) => r.id))} className="size-5 accent-[var(--accent)]" />
          Selectează toate de pe pagină
        </label>
      )}
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2 pl-4 hover:bg-surface2">
            {selectable && (
              <input type="checkbox" name="ids" value={r.id} checked={selected.includes(r.id)} onChange={() => toggle(r.id)} aria-label={`Selectează ${r.title}`} className="size-5 shrink-0 accent-[var(--accent)]" />
            )}
            <Link href={`/admin/resurse/${r.id}`} className="flex min-w-0 flex-1 flex-col gap-2 p-4 pl-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-semibold">{r.title}</span>
                <span className="text-sm text-muted">{r.meta} · {formatDateTime(r.updatedAt)}</span>
              </div>
              <div className="flex gap-2">
                {r.pinned && <Badge tone="accent">Fixat</Badge>}
                {r.state === "scheduled" ? <Badge tone="accent">Programat</Badge> : r.state === "draft" ? <Badge>Draft</Badge> : <Badge tone="ok">Publicat</Badge>}
              </div>
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="p-6 text-sm text-muted">Nicio resursă.</li>}
      </ul>
    </form>
  );
}
