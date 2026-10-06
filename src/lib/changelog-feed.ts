import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { changelog, type ChangelogEntry } from "@/lib/changelog";

const day = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });

// Static entries plus one automatic entry for each announced course and upcoming event. Newest first.
export async function loadChangelog(supabase: SupabaseClient): Promise<ChangelogEntry[]> {
  const [{ data: courses }, { data: events }] = await Promise.all([
    supabase.from("premium_courses").select("slug,title,title_en,short_description,short_description_en,published_at").eq("is_published", true).eq("announce", true).not("published_at", "is", null),
    supabase.from("events").select("slug,title,title_en,short_description,short_description_en,published_at").eq("is_published", true).eq("announce", true).not("published_at", "is", null).gt("starts_at", new Date().toISOString()),
  ]);
  return [
    ...changelog,
    ...(courses ?? []).map((c): ChangelogEntry => ({
      date: day(c.published_at as string), category: "invatare",
      title: { ro: `Curs nou: ${c.title}`, en: `New course: ${c.title_en || c.title}` },
      text: { ro: c.short_description, en: c.short_description_en || c.short_description },
      href: `/cursuri/${c.slug}`,
    })),
    ...(events ?? []).map((c): ChangelogEntry => ({
      date: day(c.published_at as string), category: "comunitate",
      title: { ro: `Eveniment nou: ${c.title}`, en: `New event: ${c.title_en || c.title}` },
      text: { ro: c.short_description, en: c.short_description_en || c.short_description },
      href: `/eveniment/${c.slug}`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
}
