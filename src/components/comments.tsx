import { ChatsCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { Alert, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { getLocale, getTx } from "@/lib/i18n";
import { CommentForm } from "@/app/(app)/resurse/comment-form";
import { deleteComment } from "@/app/(app)/resurse/comments-actions";

type Row = { id: string; parent_id: string | null; user_id: string; author_name: string; body: string; created_at: string };

export async function Comments({ resourceId, viewerId, isAdmin, enabled = true }: { resourceId: string; viewerId: string; isAdmin: boolean; enabled?: boolean }) {
  const tx = await getTx();
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("comments").select("id,parent_id,user_id,author_name,body,created_at").eq("resource_id", resourceId).order("created_at").limit(400);
  const rows = (data ?? []) as Row[];
  const top = rows.filter((r) => !r.parent_id);
  const replies = (id: string) => rows.filter((r) => r.parent_id === id);

  const item = (c: Row, reply = false) => (
    <div key={c.id} className="flex gap-3">
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-sm font-bold text-violet">{(c.author_name || "?").slice(0, 1).toUpperCase()}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm"><span className="font-bold">{c.author_name || tx("Membru", "Member")}</span> <span className="text-muted">· {formatDateTime(c.created_at, locale)}</span></p>
        <p className="max-w-[65ch] whitespace-pre-line break-words leading-relaxed">{c.body}</p>
        <div className="flex items-center gap-4">
          {!reply && (
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-muted hover:text-ink">{tx("Răspunde", "Reply")}</summary>
              <div className="pb-3"><CommentForm resourceId={resourceId} parentId={c.id} label={tx("Scrie un răspuns", "Write a reply")} /></div>
            </details>
          )}
          {(c.user_id === viewerId || isAdmin) && (
            <form action={deleteComment}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="resourceId" value={resourceId} />
              <button className="min-h-11 text-sm font-semibold text-muted hover:text-danger">{tx("Șterge", "Delete")}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="comentarii" className="flex flex-col gap-6 rounded-card border border-line bg-surface p-5 shadow-card md:p-8">
      <h2 id="comentarii" className="text-xl font-bold tracking-tight">{tx("Comentarii", "Comments")} ({rows.length})</h2>
      {enabled ? (
        <CommentForm resourceId={resourceId} label={tx("Scrie un comentariu sau o întrebare", "Write a comment or a question")} />
      ) : (
        <Alert kind="info">{tx("Comentariile sunt dezactivate pentru această resursă.", "Comments are disabled for this resource.")}</Alert>
      )}
      <ul className="flex flex-col divide-y divide-line">
        {top.map((c) => (
          <li key={c.id} className="flex flex-col gap-4 py-5 first:pt-0">
            {item(c)}
            {replies(c.id).length > 0 && <div className="ml-6 flex flex-col gap-4 border-l border-line pl-5 md:ml-12">{replies(c.id).map((r) => item(r, true))}</div>}
          </li>
        ))}
        {top.length === 0 && (
          <li className="pt-2">
            <EmptyState icon={ChatsCircle} title={tx("Nu există comentarii încă", "No comments yet")} text={enabled ? tx("Pune prima întrebare sau scrie ce ai reținut din această resursă.", "Ask the first question or write what you took away from this resource.") : undefined} />
          </li>
        )}
      </ul>
    </section>
  );
}
