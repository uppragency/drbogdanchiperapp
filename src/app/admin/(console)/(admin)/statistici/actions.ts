"use server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type OnlineUser = { user_id: string; first_name: string; last_name: string; email: string; last_seen: string };

// Members whose session was refreshed in the last 15 minutes (approximate presence, not real time).
export async function getOnlineNow(): Promise<OnlineUser[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_online_now", { p_minutes: 15 });
  return (data ?? []) as OnlineUser[];
}
