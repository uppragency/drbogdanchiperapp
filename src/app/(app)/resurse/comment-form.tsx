"use client";
import { useActionState, useRef } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { addComment } from "./comments-actions";
import type { FormState } from "@/app/login/actions";

export function CommentForm({ resourceId, parentId, label }: { resourceId: string; parentId?: string; label: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await addComment(prev, fd);
    if (res.ok) ref.current?.reset();
    return res;
  }, {});
  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="resourceId" value={resourceId} />
      <input type="hidden" name="parentId" value={parentId ?? ""} />
      <label className="sr-only" htmlFor={`body-${parentId ?? "new"}`}>{label}</label>
      <textarea id={`body-${parentId ?? "new"}`} name="body" rows={parentId ? 2 : 3} required minLength={2} maxLength={2000} placeholder={label} className="w-full rounded-control border border-line bg-bg p-4 text-base placeholder:text-muted focus:border-accent focus:outline-none" />
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>{parentId ? "Răspunde" : "Publică comentariul"}</SubmitButton></div>
    </form>
  );
}
