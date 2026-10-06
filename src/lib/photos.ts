import type { SupabaseClient } from "@supabase/supabase-js";

export const PHOTO_BUCKET = "resource-photos";

export type PhotoPreview = { urls: string[]; total: number };

// First thumbnails (max 4) and photo count per resource, signed for one hour. RLS limits rows to what the viewer may read.
export async function photoPreviews(supabase: SupabaseClient, ids: string[]): Promise<Map<string, PhotoPreview>> {
  const out = new Map<string, PhotoPreview>();
  if (!ids.length) return out;
  const { data } = await supabase.from("resource_images").select("resource_id,thumb_path,position").in("resource_id", ids).order("position");
  const rows = (data ?? []) as { resource_id: string; thumb_path: string }[];
  const byRes = new Map<string, string[]>();
  rows.forEach((r) => byRes.set(r.resource_id, [...(byRes.get(r.resource_id) ?? []), r.thumb_path]));
  const wanted = [...byRes.values()].flatMap((p) => p.slice(0, 4));
  if (!wanted.length) return out;
  const { data: signed } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(wanted, 3600);
  const url = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  byRes.forEach((paths, id) => {
    const urls = paths.slice(0, 4).map((p) => url.get(p)).filter((u): u is string => Boolean(u));
    if (urls.length) out.set(id, { urls, total: paths.length });
  });
  return out;
}
