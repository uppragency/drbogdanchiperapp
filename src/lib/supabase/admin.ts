/* eslint-disable @typescript-eslint/no-explicit-any -- schema types are not generated yet */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, serverSecret } from "@/lib/env";

// Service role client. Server only, bypasses RLS. Never import from a client component.
export function createAdminClient() {
  return createClient<any>(env.supabaseUrl, serverSecret("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
