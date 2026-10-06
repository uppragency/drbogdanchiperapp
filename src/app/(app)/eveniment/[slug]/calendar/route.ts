import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Calendar file for one published event.
export async function GET(_: NextRequest, ctx: RouteContext<"/eveniment/[slug]/calendar">) {
  await requireUser();
  const { slug } = await ctx.params;
  const supabase = await createClient();
  const { data: e } = await supabase.from("events").select("id,slug,title,short_description,format,city,starts_at,ends_at").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!e) return new NextResponse("Not found", { status: 404 });
  const start = new Date(e.starts_at);
  const end = e.ends_at ? new Date(e.ends_at) : new Date(start.getTime() + 2 * 3600000);
  const url = `${env.siteUrl}/eveniment/${e.slug}`;
  const where = e.format === "online" ? "Online" : ["Fizic", e.city].filter(Boolean).join(", ");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MentorMed//Platforma//RO",
    "BEGIN:VEVENT",
    `UID:${e.id}@platforma.drbogdanchiper.ro`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(`${e.short_description}\n${url}`.trim())}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${e.slug}.ics"`, "Cache-Control": "private, no-store" } });
}
