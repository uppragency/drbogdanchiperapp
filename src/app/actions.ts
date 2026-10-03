"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function logout() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (claims?.sub && typeof claims.session_id === "string") {
    await createAdminClient().rpc("revoke_session", { p_user: claims.sub, p_session: claims.session_id });
  }
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
