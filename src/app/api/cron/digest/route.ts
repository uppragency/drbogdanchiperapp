import { NextResponse, type NextRequest } from "next/server";
import { sendWeeklyDigest } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Called by Vercel Cron, which sends "Authorization: Bearer $CRON_SECRET".
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  const result = await sendWeeklyDigest();
  return NextResponse.json(result);
}
