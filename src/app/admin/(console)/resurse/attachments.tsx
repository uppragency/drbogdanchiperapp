"use client";
import { useActionState, useRef, useState } from "react";
import { Alert, Field, btn } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/client";
import { addLinkAttachment, registerFileAttachment } from "./actions";
import type { FormState } from "@/app/login/actions";

const MAX_BYTES = 50 * 1024 * 1024;

export function FileUploader({ resourceId }: { resourceId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<FormState>({});

  async function onChange() {
    const file = input.current?.files?.[0];
    if (!file) return;
    setMsg({});
    if (file.size > MAX_BYTES) return setMsg({ error: "Fișierul depășește 50 MB." });
    setBusy(true);
    const safe = file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
    const path = `${resourceId}/${crypto.randomUUID()}-${safe}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("resources").upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) {
      setBusy(false);
      return setMsg({ error: "Încărcarea a eșuat." });
    }
    const kind = file.type === "application/pdf" ? "pdf" : "file";
    const res = await registerFileAttachment({ resourceId, path, label: file.name.replace(/\.[^.]+$/, ""), kind });
    setBusy(false);
    setMsg(res);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <label className={`${btn.secondary} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? "Se încarcă" : "Încarcă fișier (maximum 50 MB)"}
        <input ref={input} type="file" onChange={onChange} className="sr-only" disabled={busy} />
      </label>
      {msg.error && <Alert>{msg.error}</Alert>}
      {msg.ok && <Alert kind="ok">{msg.ok}</Alert>}
    </div>
  );
}

export function LinkAttachmentForm({ resourceId }: { resourceId: string }) {
  const [state, action] = useActionState<FormState, FormData>(addLinkAttachment, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="resourceId" value={resourceId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Etichetă" name="label" required />
        <Field label="Link" name="url" type="url" placeholder="https://" required />
      </div>
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton variant="secondary">Adaugă link</SubmitButton></div>
    </form>
  );
}
