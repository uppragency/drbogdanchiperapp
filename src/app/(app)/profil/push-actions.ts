"use server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n";
import { sendPushToUser } from "@/lib/push";

const subSchema = z.object({
  endpoint: z.string().url().max(2048).refine((u) => u.startsWith("https://"), "https only"),
  keys: z.object({ p256dh: z.string().min(1).max(512), auth: z.string().min(1).max(512) }),
});

export async function savePushSubscription(input: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<{ ok: boolean }> {
  const viewer = await requireUser();
  const parsed = subSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const locale = await getLocale();
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: viewer.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, locale }, { onConflict: "endpoint" });
  return { ok: !error };
}

export async function removePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  const viewer = await requireUser();
  const parsed = z.string().url().max(2048).safeParse(endpoint);
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", viewer.id).eq("endpoint", parsed.data);
  return { ok: !error };
}

export async function sendTestPush(): Promise<{ ok: boolean; sent: number }> {
  const viewer = await requireUser();
  const { sent } = await sendPushToUser(viewer.id, (l) => ({
    title: "MentorMed",
    body: l === "en" ? "Notifications work on this device." : "Notificările funcționează pe acest dispozitiv.",
    url: "/feed",
    tag: "test",
  }));
  return { ok: sent > 0, sent };
}
