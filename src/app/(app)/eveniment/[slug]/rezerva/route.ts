import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Counts the click on the registration button, then sends the member to the registration page with UTM tags.
export async function GET(request: NextRequest, ctx: RouteContext<"/eveniment/[slug]/rezerva">) {
  const viewer = await requireUser();
  const { slug } = await ctx.params;
  const source = request.nextUrl.searchParams.get("s") === "page" ? "page" : "card";
  const supabase = await createClient();
  const { data: e } = await supabase.from("events").select("id,slug,register_url").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!e) return new NextResponse("Not found", { status: 404 });

  // A failed insert never blocks the redirect.
  await supabase.from("event_clicks").insert({ event_id: e.id, user_id: viewer.id, source });

  let target: URL;
  try {
    target = new URL(e.register_url);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") return new NextResponse("Not found", { status: 404 });
  target.searchParams.set("utm_source", "platforma");
  target.searchParams.set("utm_medium", source === "card" ? "card-eveniment" : "pagina-eveniment");
  target.searchParams.set("utm_campaign", e.slug);
  return NextResponse.redirect(target, 307);
}
