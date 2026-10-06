"use client";
import { useRef, useState } from "react";
import { Alert, btn } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { coverUrl } from "@/lib/cover-url";
import { setCourseCover } from "./actions";
import type { FormState } from "@/app/login/actions";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 3 * 1024 * 1024;

export function CourseCoverUpload({ courseId, current }: { courseId: string; current: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState(current);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<FormState>({});

  async function onChange() {
    const file = input.current?.files?.[0];
    if (!file) return;
    setMsg({});
    const ext = TYPES[file.type];
    if (!ext) return setMsg({ error: "Alege o imagine JPG, PNG sau WebP." });
    if (file.size > MAX_BYTES) return setMsg({ error: "Imaginea depășește 3 MB." });
    setBusy(true);
    const next = `courses/${courseId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from("covers").upload(next, file, { contentType: file.type, upsert: false });
    if (error) {
      setBusy(false);
      return setMsg({ error: "Încărcarea a eșuat." });
    }
    const res = await setCourseCover(courseId, next);
    setBusy(false);
    setMsg(res);
    if (!res.error) setPath(next);
    if (input.current) input.current.value = "";
  }

  async function remove() {
    setBusy(true);
    const res = await setCourseCover(courseId, null);
    setBusy(false);
    setMsg(res);
    if (!res.error) setPath(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {path && (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of a public image
        <img src={coverUrl(path)} alt="Imaginea curentă" className="aspect-square w-full max-w-xs rounded-card border border-line object-cover" />
      )}
      <div className="flex flex-wrap gap-2">
        <label className={`${btn.secondary} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? "Se încarcă" : path ? "Înlocuiește imaginea" : "Încarcă imagine pătrată (JPG, PNG, WebP, maximum 3 MB)"}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onChange} disabled={busy} />
        </label>
        {path && <button type="button" className={btn.danger} onClick={remove} disabled={busy}>Șterge imaginea</button>}
      </div>
      {msg.error && <Alert>{msg.error}</Alert>}
      {msg.ok && <Alert kind="ok">{msg.ok}</Alert>}
    </div>
  );
}
