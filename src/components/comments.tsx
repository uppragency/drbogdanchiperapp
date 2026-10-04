import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { CommentForm } from "@/app/(app)/resurse/comment-form";
import { deleteComment } from "@/app/(app)/resurse/comments-actions";

type Row = { id: string; parent_id: string | null; user_id: string; author_name: string; body: string; created_at: string };

export async function Comments({ resourceId, viewerId, isAdmin }: { resourceId: string; viewerId: string; isAdmin: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase.from("comments").select("id,parent_id,user_id,author_name,body,created_at").eq("resource_id", resourceId).order("created_at").limit(400);
  const rows = (data ?? []) as Row[];
  const top = rows.filter((r) => !r.parent_id);
  const replies = (id: string) => rows.filter((r) => r.parent_id === id);

  const item = (c: Row, reply = false) => (
    <div key={c.id} className="flex gap-3">
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-sm font-bold text-violet">{(c.author_name || "?").slice(0, 1).toUpperCase()}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm"><span className="font-bold">{c.author_name || "Membru"}</span> <span className="text-muted">· {formatDateTime(c.created_at)}</span></p>
        <p className="max-w-[65ch] whitespace-pre-line break-words leading-relaxed">{c.body}</p>
        <div className="flex items-center gap-4">
          {!reply && (
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-muted hover:text-ink">Răspunde</summary>
              <div className="pb-3"><CommentForm resourceId={resourceId} parentId={c.id} label="Scrie un răspuns" /></div>
            </details>
          )}
          {(c.user_id === viewerId || isAdmin) && (
            <form action={deleteComment}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="resourceId" value={resourceId} />
              <button className="min-h-11 text-sm font-semibold text-muted hover:text-danger">Șterge</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="comentarii" className="flex flex-col gap-6 rounded-card border border-line bg-surface p-5 shadow-card md:p-8">
      <h2 id="comentarii" className="text-xl font-bold tracking-tight">Comentarii ({rows.length})</h2>
      <CommentForm resourceId={resourceId} label="Scrie un comentariu sau o întrebare" />
      <ul className="flex flex-col divide-y divide-line">
        {top.map((c) => (
          <li key={c.id} className="flex flex-col gap-4 py-5 first:pt-0">
            {item(c)}
            {replies(c.id).length > 0 && <div className="ml-6 flex flex-col gap-4 border-l border-line pl-5 md:ml-12">{replies(c.id).map((r) => item(r, true))}</div>}
          </li>
        ))}
        {top.length === 0 && <li className="py-2 text-sm text-muted">Nu există comentarii încă. Fii primul care scrie.</li>}
      </ul>
    </section>
  );
}
