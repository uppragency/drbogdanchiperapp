import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkUrl, runPool } from "@/lib/link-check";
import { renderEmail, sendEmails } from "@/lib/email";

export const maxDuration = 300;

const SITE = "https://drbogdanchiper.ro";
const MAX_URLS = 600;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${secret}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

async function locs(url: string): Promise<string[]> {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; MentorMedLinkCheck/1.0)" }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

// Monthly check (Vercel Cron, 1st of the month): every public page of drbogdanchiper.ro from the Yoast sitemap, report by email to the admin.
export async function GET(request: NextRequest) {
  if (!authorized(request)) return new NextResponse("Unauthorized", { status: 401 });

  let urls: string[];
  try {
    const subs = await locs(`${SITE}/sitemap_index.xml`);
    const lists = await Promise.all(subs.filter((s) => s.startsWith(SITE) && s.endsWith(".xml")).map((s) => locs(s).catch(() => [] as string[])));
    urls = [...new Set(lists.flat().filter((u) => u.startsWith(SITE)))].slice(0, MAX_URLS);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "sitemap" }, { status: 502 });
  }

  const broken: { url: string; status: string }[] = [];
  await runPool(urls, 8, async (u) => {
    const r = await checkUrl(u);
    if (!r.ok) broken.push({ url: u, status: r.status });
  });
  broken.sort((a, b) => a.url.localeCompare(b.url));

  const { data: admins } = await createAdminClient().from("profiles").select("email").eq("role", "admin").eq("is_active", true).is("deleted_at", null);
  const to = (admins ?? []).map((a) => a.email).filter((e): e is string => !!e);

  const month = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date());
  const html = renderEmail({
    title: broken.length === 0 ? "Site public: nicio pagină defectă" : `Site public: ${broken.length} pagini cu probleme`,
    body: `Verificare lunară (${month}) pe ${urls.length} pagini din drbogdanchiper.ro, luate din sitemap.${broken.length === 0 ? " Toate răspund corect." : " Paginile de mai jos nu răspund corect."}`,
    ctaLabel: "Deschide site-ul",
    ctaUrl: SITE,
    items: broken.slice(0, 50).map((b) => ({ title: b.url, url: b.url, meta: `Răspuns: ${b.status}` })),
    note: broken.length > 50 ? `Se afișează primele 50 din ${broken.length}.` : undefined,
  });
  const sent = await sendEmails(to.map((addr) => ({ to: addr, subject: `Raport lunar linkuri site: ${broken.length === 0 ? "totul în regulă" : `${broken.length} probleme`}`, html })));

  return NextResponse.json({ checked: urls.length, broken: broken.length, emailed: sent.sent });
}
