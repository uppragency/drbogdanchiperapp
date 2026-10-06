import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Streams a PDF attachment inline so it can be shown inside the page. Row level security decides who may read it.
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer || !viewer.termsAcceptedAt) return NextResponse.redirect(new URL("/login", request.url));
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });

  const supabase = await createClient();
  const { data: attachment } = await supabase.from("resource_attachments").select("file_path,label,kind").eq("id", id).maybeSingle();
  if (!attachment?.file_path || attachment.kind !== "pdf") return new NextResponse("Not found", { status: 404 });

  const { data } = await supabase.storage.from("resources").createSignedUrl(attachment.file_path, 60);
  if (!data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  const upstream = await fetch(data.signedUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "frame-ancestors 'self'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
