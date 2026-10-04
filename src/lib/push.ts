import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = { title: string; body: string; url: string; tag?: string };
type Sub = { id: string; endpoint: string; p256dh: string; auth: string; locale: string };
type Counts = { sent: number; failed: number };

let configured: boolean | null = null;
function configure(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return (configured = false);
  try {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

// Sends one payload per subscription (payloadFor gets the subscription), in parallel batches of 10.
async function deliver(subs: Sub[], payloadFor: (s: Sub) => PushPayload): Promise<Counts> {
  const admin = createAdminClient();
  let sent = 0;
  let failed = 0;
  const gone: string[] = [];
  for (let i = 0; i < subs.length; i += 10) {
    await Promise.all(
      subs.slice(i, i + 10).map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payloadFor(s)), { TTL: 86400 });
          sent++;
        } catch (e) {
          failed++;
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) gone.push(s.id);
        }
      }),
    );
  }
  if (gone.length) await admin.from("push_subscriptions").delete().in("id", gone);
  return { sent, failed };
}

export async function sendPushToUser(userId: string, payload: PushPayload | ((locale: "ro" | "en") => PushPayload)): Promise<Counts> {
  try {
    if (!configure()) return { sent: 0, failed: 0 };
    const { data } = await createAdminClient().from("push_subscriptions").select("id,endpoint,p256dh,auth,locale").eq("user_id", userId);
    const subs = (data ?? []) as Sub[];
    return await deliver(subs, (s) => (typeof payload === "function" ? payload(s.locale === "en" ? "en" : "ro") : payload));
  } catch {
    return { sent: 0, failed: 0 };
  }
}

export async function notifyNewResource(resourceId: string): Promise<Counts> {
  try {
    if (!configure()) return { sent: 0, failed: 0 };
    const admin = createAdminClient();
    const { data: res } = await admin.from("resources").select("id,title,title_en,category_id,status,deleted_at").eq("id", resourceId).maybeSingle();
    if (!res || res.status !== "published" || res.deleted_at) return { sent: 0, failed: 0 };

    const { data: rt } = await admin.from("resource_tags").select("tag_id").eq("resource_id", resourceId);
    const tagIds = (rt ?? []).map((r: { tag_id: string }) => r.tag_id);
    if (!tagIds.length) return { sent: 0, failed: 0 };
    const { data: ut } = await admin.from("user_tags").select("user_id").in("tag_id", tagIds);
    let userIds = [...new Set((ut ?? []).map((r: { user_id: string }) => r.user_id))];
    if (!userIds.length) return { sent: 0, failed: 0 };

    const { data: profs } = await admin.from("profiles").select("id").in("id", userIds).eq("role", "user").eq("is_active", true).is("deleted_at", null);
    userIds = (profs ?? []).map((p: { id: string }) => p.id);
    if (!userIds.length) return { sent: 0, failed: 0 };

    if (res.category_id) {
      const { data: follows } = await admin.from("category_subscriptions").select("user_id,category_id").in("user_id", userIds);
      const rows = (follows ?? []) as { user_id: string; category_id: string }[];
      const hasFollows = new Set(rows.map((r) => r.user_id));
      const followsThis = new Set(rows.filter((r) => r.category_id === res.category_id).map((r) => r.user_id));
      userIds = userIds.filter((id) => !hasFollows.has(id) || followsThis.has(id));
    }
    if (!userIds.length) return { sent: 0, failed: 0 };

    const { data: subsData } = await admin.from("push_subscriptions").select("id,endpoint,p256dh,auth,locale").in("user_id", userIds);
    const subs = (subsData ?? []) as Sub[];
    const titleEn = typeof res.title_en === "string" && res.title_en.trim() ? res.title_en : res.title;
    return await deliver(subs, (s) => {
      const en = s.locale === "en";
      return { title: en ? "New resource" : "Resursă nouă", body: en ? titleEn : res.title, url: `/resurse/${res.id}`, tag: res.id };
    });
  } catch {
    return { sent: 0, failed: 0 };
  }
}
