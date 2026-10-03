import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

// Returns true when the action is allowed, false when the limit is exceeded.
export async function allow(key: string, limit: number, windowSeconds: number) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("throttle_hit", {
    p_key: key.toLowerCase().slice(0, 200),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) return true; // never lock users out because the limiter failed
  return data === true;
}
