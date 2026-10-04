import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Calendar file for one event. Access follows the same rules as the resource page.
export async function GET(_: NextRequest, ctx: RouteContext<"/api/evenimente/[id]">) {
  await requireUser();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: r } = await supabase.from("resources").select("id,title,description,event_at").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!r?.event_at) return new NextResponse("Not found", { status: 404 });
  const start = new Date(r.event_at);
  const end = new Date(start.getTime() + 60 * 60000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MentorMed//Platforma//RO",
    "BEGIN:VEVENT",
    `UID:${r.id}@platforma.drbogdanchiper.ro`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(r.title)}`,
    `DESCRIPTION:${esc(`${r.description ?? ""}\n${env.siteUrl}/resurse/${r.id}`.trim())}`,
    `URL:${env.siteUrl}/resurse/${r.id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="eveniment.ics"', "Cache-Control": "private, no-store" } });
}
