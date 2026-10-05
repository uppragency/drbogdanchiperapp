import "server-only";
import { createClient } from "@/lib/supabase/server";

export const FILE_PREFIX = "fisier:";

export type Item = { resource_id: string; url: string };

// Everything worth checking on published resources: video/link urls, link attachments and uploaded files.
export async function gatherItems(): Promise<Item[]> {
  const supabase = await createClient();
  const { data: res } = await supabase.from("resources").select("id,type,video_url").eq("status", "published").is("deleted_at", null).limit(2000);
  const resources = (res ?? []) as { id: string; type: string; video_url: string | null }[];
  const items: Item[] = [];
  for (const r of resources) if ((r.type === "video" || r.type === "link") && r.video_url) items.push({ resource_id: r.id, url: r.video_url });
  const ids = resources.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 200) {
    const { data: atts } = await supabase.from("resource_attachments").select("resource_id,kind,url,file_path").in("resource_id", ids.slice(i, i + 200));
    for (const a of (atts ?? []) as { resource_id: string; kind: string; url: string | null; file_path: string | null }[]) {
      if (a.kind === "link" && a.url) items.push({ resource_id: a.resource_id, url: a.url });
      else if (a.file_path) items.push({ resource_id: a.resource_id, url: FILE_PREFIX + a.file_path });
    }
  }
  const seen = new Set<string>();
  return items.filter((x) => {
    const k = `${x.resource_id}|${x.url}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
