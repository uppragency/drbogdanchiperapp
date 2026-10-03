/* eslint-disable @typescript-eslint/no-explicit-any -- schema types are not generated yet */
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  return createBrowserClient<any>(env.supabaseUrl, env.supabaseKey);
}
