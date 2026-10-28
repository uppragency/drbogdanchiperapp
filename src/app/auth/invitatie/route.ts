import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Permanent invitation link. The token never expires; at click time a fresh one time sign in token is generated.
// Stops working once the invitation is accepted or the account is deactivated.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token = searchParams.get("t") ?? "";
  if (!/^[0-9a-f]{48}$/.test(token)) return NextResponse.redirect(`${origin}/login?eroare=link`);

  const admin = createAdminClient();
  const { data: row } = await admin.from("invitation_tokens").select("user_id").eq("token", token).maybeSingle();
  if (!row) return NextResponse.redirect(`${origin}/login?eroare=link`);

  const [{ data: inv }, { data: profile }] = await Promise.all([
    admin.from("invitations").select("accepted_at").eq("user_id", row.user_id).maybeSingle(),
    admin.from("profiles").select("email,is_active,deleted_at").eq("id", row.user_id).maybeSingle(),
  ]);
  if (!profile || !profile.is_active || profile.deleted_at) return NextResponse.redirect(`${origin}/login?eroare=link`);
  if (inv?.accepted_at) return NextResponse.redirect(`${origin}/login`);

  const { data } = await admin.auth.admin.generateLink({ type: "recovery", email: profile.email });
  const hash = data?.properties?.hashed_token;
  if (!hash) return NextResponse.redirect(`${origin}/login?eroare=link`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: hash });
  if (error) return NextResponse.redirect(`${origin}/login?eroare=link`);
  return NextResponse.redirect(`${origin}/setare-parola`);
}
