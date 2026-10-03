import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Clears the session cookies (used when a session was revoked or access ended).
export async function GET(request: NextRequest) {
  const motiv = request.nextUrl.searchParams.get("motiv");
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const allowed = motiv === "sesiune" || motiv === "inactiv" ? `?motiv=${motiv}` : "";
  return NextResponse.redirect(`${request.nextUrl.origin}/login${allowed}`);
}
