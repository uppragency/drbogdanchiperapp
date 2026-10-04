import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderEmail, sendEmails, type OutgoingEmail } from "@/lib/email";
import { unsubUrl } from "@/lib/unsub";
import { env } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

type Member = { id: string; email: string; first_name: string; user_tags: { tag_id: string }[] };
type Res = { id: string; title: string; description: string; publish_at: string | null; created_at: string; event_at: string | null; resource_tags: { tag_id: string }[] };

async function loadMembers() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id,email,first_name,access_expires_at,user_tags(tag_id)")
    .eq("role", "user")
    .eq("is_active", true)
    .eq("email_notifications", true)
    .is("deleted_at", null)
    .not("last_login_at", "is", null)
    .limit(2000);
  const now = new Date().toISOString();
  return ((data ?? []) as (Member & { access_expires_at: string | null })[]).filter((m) => !m.access_expires_at || m.access_expires_at > now);
}

const overlaps = (m: Member, r: Res) => r.resource_tags.some((rt) => m.user_tags.some((ut) => ut.tag_id === rt.tag_id));
const link = (id: string) => `${env.siteUrl}/resurse/${id}`;

// Weekly email: resources published in the last 7 days that match the member's groups.
export async function sendWeeklyDigest() {
  const admin = createAdminClient();
  const nowMs = new Date().getTime();
  const since = nowMs - 7 * 86400000;
  const { data } = await admin
    .from("resources")
    .select("id,title,description,publish_at,created_at,event_at,resource_tags(tag_id)")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(300);
  const fresh = ((data ?? []) as Res[]).filter((r) => {
    const t = new Date(r.publish_at ?? r.created_at).getTime();
    return t >= since && t <= nowMs;
  });
  if (fresh.length === 0) return { sent: 0, failed: 0, skipped: 0 };

  const members = await loadMembers();
  const emails: OutgoingEmail[] = [];
  for (const m of members) {
    const mine = fresh.filter((r) => overlaps(m, r));
    if (mine.length === 0) continue;
    emails.push({
      to: m.email,
      subject: mine.length === 1 ? "O resursă nouă în platforma MentorMed" : `${mine.length} resurse noi în platforma MentorMed`,
      html: renderEmail({
        title: m.first_name ? `Bună, ${m.first_name}` : "Noutăți în platformă",
        body: mine.length === 1 ? "Săptămâna aceasta a apărut o resursă nouă pentru grupul tău." : "Săptămâna aceasta au apărut resurse noi pentru grupul tău.",
        items: mine.slice(0, 8).map((r) => ({ title: r.title, url: link(r.id), meta: r.event_at ? `Eveniment: ${formatDateTime(r.event_at)}` : undefined })),
        ctaLabel: "Deschide platforma",
        ctaUrl: `${env.siteUrl}/feed`,
        unsubscribeUrl: unsubUrl(m.id),
      }),
    });
  }
  const res = await sendEmails(emails);
  return { sent: res.sent, failed: res.failed.length, skipped: members.length - emails.length };
}

// Daily check: events starting within the next 36 hours get one reminder.
export async function sendEventReminders() {
  const admin = createAdminClient();
  const now = new Date();
  const until = new Date(now.getTime() + 36 * 3600000).toISOString();
  const { data } = await admin
    .from("resources")
    .select("id,title,description,publish_at,created_at,event_at,resource_tags(tag_id)")
    .eq("status", "published")
    .is("deleted_at", null)
    .is("reminder_sent_at", null)
    .not("event_at", "is", null)
    .gte("event_at", now.toISOString())
    .lte("event_at", until);
  const events = (data ?? []) as Res[];
  if (events.length === 0) return { events: 0, sent: 0, failed: 0 };

  const members = await loadMembers();
  let sent = 0;
  let failed = 0;
  for (const ev of events) {
    const emails: OutgoingEmail[] = members.filter((m) => overlaps(m, ev)).map((m) => ({
      to: m.email,
      subject: `Reminder: ${ev.title}`.slice(0, 150),
      html: renderEmail({
        title: ev.title,
        body: `Evenimentul are loc ${formatDateTime(ev.event_at)}. Linkul de acces și detaliile sunt pe pagina resursei.`,
        ctaLabel: "Deschide evenimentul",
        ctaUrl: link(ev.id),
        unsubscribeUrl: unsubUrl(m.id),
      }),
    }));
    const res = await sendEmails(emails);
    sent += res.sent;
    failed += res.failed.length;
    // Mark as sent unless every send failed, so a provider outage is retried on the next run.
    if (res.sent > 0 || emails.length === 0) await admin.from("resources").update({ reminder_sent_at: new Date().toISOString() }).eq("id", ev.id);
  }
  return { events: events.length, sent, failed };
}
