import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Short lived signed link. Row level security decides whether this user may read the attachment.
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer || !viewer.termsAcceptedAt) return NextResponse.redirect(new URL("/login", request.url));
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });

  const supabase = await createClient();
  const { data: attachment } = await supabase.from("resource_attachments").select("file_path,label").eq("id", id).maybeSingle();
  if (!attachment?.file_path) return new NextResponse("Not found", { status: 404 });

  const { data } = await supabase.storage.from("resources").createSignedUrl(attachment.file_path, 60);
  if (!data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  const res = NextResponse.redirect(data.signedUrl);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
