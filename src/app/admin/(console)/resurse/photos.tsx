"use client";
import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, btn } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { deletePhoto, movePhoto, registerPhoto, savePhotoCaption } from "./actions";
import type { FormState } from "@/app/login/actions";

const MAX_PHOTOS = 30;
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const FULL_PX = 2200;
const THUMB_PX = 480;

export type PhotoItem = { id: string; thumbUrl: string; caption: string; captionEn: string };

// Resizes in the browser (also strips EXIF/GPS because the canvas re-encodes only pixels).
async function toJpeg(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
  if (!blob) throw new Error("encode");
  return { blob, width, height };
}

export function PhotoUploader({ resourceId, count }: { resourceId: string; count: number }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const remaining = MAX_PHOTOS - count;

  async function onChange() {
    const files = Array.from(input.current?.files ?? []);
    if (!files.length) return;
    setErrors([]);
    const errs: string[] = [];
    const queue = files.slice(0, Math.max(0, remaining));
    if (files.length > queue.length) errs.push(`Maximum ${MAX_PHOTOS} de poze. ${files.length - queue.length} poze au fost ignorate.`);
    setBusy(true);
    const supabase = createClient();
    let done = 0;
    for (const file of queue) {
      setProgress(`Se încarcă ${done + 1} din ${queue.length}`);
      try {
        if (!file.type.startsWith("image/")) throw new Error("Nu este imagine.");
        if (file.size > MAX_SOURCE_BYTES) throw new Error("Depășește 40 MB.");
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        const full = await toJpeg(bitmap, FULL_PX, 0.85);
        const thumb = await toJpeg(bitmap, THUMB_PX, 0.8);
        bitmap.close();
        const key = crypto.randomUUID();
        const bucket = supabase.storage.from("resource-photos");
        const a = await bucket.upload(`${resourceId}/${key}.jpg`, full.blob, { contentType: "image/jpeg", upsert: false });
        if (a.error) throw new Error("Încărcarea a eșuat.");
        const b = await bucket.upload(`${resourceId}/${key}-t.jpg`, thumb.blob, { contentType: "image/jpeg", upsert: false });
        if (b.error) {
          await bucket.remove([`${resourceId}/${key}.jpg`]);
          throw new Error("Încărcarea a eșuat.");
        }
        const res = await registerPhoto({ resourceId, key, width: full.width, height: full.height });
        if (res.error) throw new Error(res.error);
      } catch (e) {
        errs.push(`${file.name}: ${e instanceof Error && e.message.length < 80 ? e.message : "format neacceptat."}`);
      }
      done++;
    }
    setBusy(false);
    setProgress("");
    setErrors(errs);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <label className={`${btn.secondary} w-fit cursor-pointer ${busy || remaining <= 0 ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? progress : remaining <= 0 ? `Limita de ${MAX_PHOTOS} poze a fost atinsă` : `Adaugă poze (încă ${remaining})`}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={onChange} className="sr-only" disabled={busy || remaining <= 0} />
      </label>
      <p className="text-sm text-muted">Pozele se redimensionează automat la maximum 2200 px și se elimină datele ascunse (locație, dispozitiv). Prima poză este coperta în liste.</p>
      {errors.length > 0 && <Alert>{errors.join(" · ")}</Alert>}
    </div>
  );
}

export function PhotoRow({ photo, index, total }: { photo: PhotoItem; index: number; total: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (_prev, fd) => savePhotoCaption(fd), {});
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.thumbUrl} alt="" className="size-28 shrink-0 rounded-control border border-line object-cover" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={photo.id} />
          <input name="caption" defaultValue={photo.caption} maxLength={500} placeholder="Descriere (română), opțional" className="h-11 rounded-control border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none" />
          <input name="captionEn" defaultValue={photo.captionEn} maxLength={500} placeholder="Descriere (engleză), opțional" className="h-11 rounded-control border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none" />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className={btn.secondary}>{pending ? "Se salvează" : "Salvează descrierea"}</button>
            {state.ok && <span className="text-sm text-muted">{state.ok}</span>}
            {state.error && <span className="text-sm text-danger">{state.error}</span>}
          </div>
        </form>
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-2 text-sm text-muted">{index === 0 ? "Copertă" : `Poza ${index + 1}`}</span>
          <form action={movePhoto}><input type="hidden" name="id" value={photo.id} /><input type="hidden" name="dir" value="up" /><button disabled={index === 0} className="min-h-11 px-3 text-sm font-semibold disabled:opacity-40">Mai sus</button></form>
          <form action={movePhoto}><input type="hidden" name="id" value={photo.id} /><input type="hidden" name="dir" value="down" /><button disabled={index === total - 1} className="min-h-11 px-3 text-sm font-semibold disabled:opacity-40">Mai jos</button></form>
          <form action={deletePhoto}><input type="hidden" name="id" value={photo.id} /><button className="min-h-11 px-3 text-sm font-semibold text-danger">Șterge</button></form>
        </div>
      </div>
    </li>
  );
}
