import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTx, pick } from "@/lib/i18n";
import { COURSE_COLUMNS, courseImage, formatLei, isNew, normalizeCourse, pricing } from "@/lib/courses";
import { Badge, EmptyState } from "@/components/ui";
import { GraduationCap } from "@phosphor-icons/react/dist/ssr";

export async function generateMetadata(): Promise<Metadata> {
  const tx = await getTx();
  return {
    title: tx("Cursuri premium", "Premium courses"),
    description: tx("Cursuri avansate de la Dr. Bogdan Chiper, cu 20% reducere pentru membrii MentorMed.", "Advanced courses by Dr. Bogdan Chiper, with a 20% member discount."),
  };
}

export default async function CoursesPage() {
  await requireUser();
  const [tx, locale] = await Promise.all([getTx(), getLocale()]);
  const supabase = await createClient();
  const { data } = await supabase.from("premium_courses").select(COURSE_COLUMNS).eq("is_published", true).order("position").order("published_at", { ascending: false });
  const courses = (data ?? []).map((r) => normalizeCourse(r as Record<string, unknown>));
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Cursuri premium", "Premium courses")}</h1>
        <p className="max-w-[60ch] text-muted">{tx("Cursuri avansate, cu reducere pentru membrii MentorMed. Prețurile includ TVA.", "Advanced courses with a discount for MentorMed members. Prices include VAT.")}</p>
      </header>
      {courses.length === 0 ? (
        <EmptyState icon={GraduationCap} title={tx("Nu există cursuri momentan", "No courses yet")} text={tx("Revino curând.", "Check back soon.")} />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const p = pricing(c);
            const img = courseImage(c);
            return (
              <li key={c.id}>
                <Link href={`/cursuri/${c.slug}`} className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-accent">
                  <div className="relative aspect-square bg-surface2">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element -- external or storage image, size unknown
                      <img src={img} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover" />
                    )}
                    <div className="absolute left-3 top-3 flex gap-2">
                      {isNew(c) && <Badge tone="accent">{tx("Nou", "New")}</Badge>}
                      {p.offerActive && <Badge tone="warn">{tx("Ofertă", "Offer")}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h2 className="text-lg font-bold leading-snug">{pick(locale, c.title, c.title_en || c.title)}</h2>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted">{pick(locale, c.short_description, c.short_description_en || c.short_description)}</p>
                    <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
                      <span className="text-xl font-bold">{formatLei(p.member)}</span>
                      {p.struck && <span className="text-sm text-muted line-through">{formatLei(p.struck)}</span>}
                    </div>
                    <p className="text-xs text-muted">{tx("Preț membru, TVA inclus", "Member price, VAT included")}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
