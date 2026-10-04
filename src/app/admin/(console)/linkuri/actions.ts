"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkUrl, runPool } from "@/lib/link-check";
import { FILE_PREFIX, gatherItems, type Item } from "./gather";

const MAX_PER_RUN = 120;
const CONCURRENCY = 6;

async function fileExists(storage: ReturnType<ReturnType<typeof createAdminClient>["storage"]["from"]>, path: string) {
  const slash = path.lastIndexOf("/");
  const folder = slash > 0 ? path.slice(0, slash) : "";
  const name = path.slice(slash + 1);
  const { data, error } = await storage.list(folder, { search: name, limit: 100 });
  if (error) return null;
  return (data ?? []).some((f) => f.name === name);
}

export async function runLinkCheck() {
  await requireAdmin();
  const supabase = await createClient();
  const items = await gatherItems();
  const keys = new Set(items.map((x) => `${x.resource_id}|${x.url}`));

  const { data: existing } = await supabase.from("link_checks").select("resource_id,url,checked_at").limit(5000);
  const checkedAt = new Map<string, string>();
  const stale: Item[] = [];
  for (const c of (existing ?? []) as { resource_id: string; url: string; checked_at: string }[]) {
    const k = `${c.resource_id}|${c.url}`;
    if (keys.has(k)) checkedAt.set(k, c.checked_at);
    else stale.push(c);
  }
  // Rows for links that no longer exist are removed.
  for (const s of stale) await supabase.from("link_checks").delete().eq("resource_id", s.resource_id).eq("url", s.url);

  // Never checked first, then oldest first.
  const ordered = [...items].sort((a, b) => (checkedAt.get(`${a.resource_id}|${a.url}`) ?? "").localeCompare(checkedAt.get(`${b.resource_id}|${b.url}`) ?? ""));
  const batch = ordered.slice(0, MAX_PER_RUN);
  const remaining = ordered.length - batch.length;

  const storage = createAdminClient().storage.from("resources");
  const rows: { resource_id: string; url: string; ok: boolean; status: string; checked_at: string }[] = [];
  await runPool(batch, CONCURRENCY, async (it) => {
    let ok: boolean;
    let status: string;
    if (it.url.startsWith(FILE_PREFIX)) {
      const exists = await fileExists(storage, it.url.slice(FILE_PREFIX.length));
      ok = exists === true;
      status = exists === null ? "eroare la verificare" : exists ? "fișier existent" : "fișier lipsă";
    } else {
      ({ ok, status } = await checkUrl(it.url));
    }
    rows.push({ resource_id: it.resource_id, url: it.url, ok, status, checked_at: new Date().toISOString() });
  });
  if (rows.length) await supabase.from("link_checks").upsert(rows, { onConflict: "resource_id,url" });

  revalidatePath("/admin/linkuri");
  revalidatePath("/admin");
  const bad = rows.filter((r) => !r.ok).length;
  redirect(`/admin/linkuri?rulat=${rows.length}&probleme=${bad}&ramase=${remaining}`);
}
