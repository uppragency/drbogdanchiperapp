import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

// Exchanges the one time token from an invitation or reset email for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const next = safeNext(searchParams.get("next"), "/setare-parola");
  if (!tokenHash) return NextResponse.redirect(`${origin}/login?eroare=link`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (error) return NextResponse.redirect(`${origin}/login?eroare=link`);
  return NextResponse.redirect(`${origin}${next}`);
}
