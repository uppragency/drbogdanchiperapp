import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTx, pick } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { COURSE_COLUMNS, courseImage, detailRows, formatLei, isNew, lines, normalizeCourse, pricing } from "@/lib/courses";
import { Badge, cn } from "@/components/ui";
import { CopyCode } from "../copy-code";
import { ArrowUpRight, CheckCircle, CaretLeft } from "@phosphor-icons/react/dist/ssr";

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("premium_courses").select(COURSE_COLUMNS).eq("slug", slug).maybeSingle();
  return data ? normalizeCourse(data as Record<string, unknown>) : null;
}

export async function generateMetadata({ params }: PageProps<"/cursuri/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [c, locale] = await Promise.all([load(slug), getLocale()]);
  if (!c) return {};
  return { title: pick(locale, c.title, c.title_en), description: pick(locale, c.short_description, c.short_description_en).slice(0, 160) };
}

const h2 = "text-xl font-bold tracking-tight";

export default async function CoursePage({ params }: PageProps<"/cursuri/[slug]">) {
  await requireUser();
  const { slug } = await params;
  const [c, tx, locale] = await Promise.all([load(slug), getTx(), getLocale()]);
  if (!c || !c.is_published) notFound();
  const p = pricing(c);
  const img = courseImage(c);
  const l = (ro: string, en: string) => pick(locale, ro, en);
  const title = l(c.title, c.title_en);
  const benefits = lines(l(c.benefits, c.benefits_en));
  const includes = lines(l(c.includes, c.includes_en));
  const details = detailRows(l(c.details, c.details_en));
  const long = lines(l(c.long_description, c.long_description_en));
  const bio = lines(l(c.presenter_bio, c.presenter_bio_en));
  const label = l(c.button_label, c.button_label_en) || tx("Vezi cursul în magazin", "View the course in the shop");
  const supabase = await createClient();
  const { data: others } = await supabase.from("premium_courses").select("slug,title,title_en,cover_path,cover_url").eq("is_published", true).neq("id", c.id).order("position").limit(3);

  const priceBlock = (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-4xl font-bold tracking-tight">{formatLei(p.member)}</span>
        {p.struck && <span className="text-lg text-muted line-through">{formatLei(p.struck)}</span>}
      </div>
      <p className="text-sm text-muted">{tx("Prețul include TVA (21%).", "The price includes VAT (21%).")}</p>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 pb-28 md:py-10 md:pb-10">
      <Link href="/cursuri" className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <CaretLeft size={16} aria-hidden /> {tx("Toate cursurile", "All courses")}
      </Link>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <div className="aspect-square overflow-hidden rounded-card border border-line bg-surface2">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element -- external or storage image
            <img src={img} alt={title} referrerPolicy="no-referrer" className="size-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {isNew(c) && <Badge tone="accent">{tx("Nou", "New")}</Badge>}
            <Badge>{tx("Curs premium", "Premium course")}</Badge>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">{title}</h1>
          <p className="max-w-[60ch] leading-relaxed text-muted">{l(c.short_description, c.short_description_en)}</p>

          {p.offerActive && p.offerUntil && (
            <p className="rounded-control bg-warn-bg px-4 py-3 text-sm font-semibold text-warn">
              {tx("Ofertă până la", "Offer until")} {formatDate(p.offerUntil, locale)}
            </p>
          )}

          {priceBlock}

          {p.discount > 0 && (
            <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
              <p className="text-sm leading-relaxed">
                {tx(`Pentru că ești membru MentorMed ai ${p.discount}% reducere, deja inclusă în preț.`, `As a MentorMed member you get ${p.discount}% off, already included in the price.`)}
              </p>
              <p className="text-sm text-muted">{tx("După redirecționare, adaugă acest cod în coșul din magazin:", "After the redirect, add this code in the shop cart:")}</p>
              <div><CopyCode code={c.member_code} /></div>
            </div>
          )}

          <div className="hidden flex-col gap-2 md:flex">
            <a href={c.shop_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-6 text-base font-semibold text-accent-ink transition-colors hover:bg-accent-hover active:scale-[0.98]">
              {label} <ArrowUpRight size={18} aria-hidden />
            </a>
            <p className="text-sm text-muted">{tx("Plata se face pe drbogdanchiper.ro. Se deschide într-o pagină nouă.", "Payment is made on drbogdanchiper.ro. Opens in a new tab.")}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-10 lg:col-span-2">
          {long.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className={h2}>{tx("Despre curs", "About the course")}</h2>
              {long.map((t, i) => <p key={i} className="max-w-[65ch] leading-relaxed text-muted">{t}</p>)}
            </section>
          )}
          {benefits.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className={h2}>{tx("Beneficii", "Benefits")}</h2>
              <ul className="flex flex-col gap-2">
                {benefits.map((t, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed"><CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-ok" aria-hidden />{t}</li>
                ))}
              </ul>
            </section>
          )}
          {includes.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className={h2}>{tx("Ce include", "What is included")}</h2>
              <ul className="flex flex-col gap-2">
                {includes.map((t, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed"><CheckCircle size={22} className="mt-0.5 shrink-0 text-accent" aria-hidden />{t}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside className="flex flex-col gap-8">
          {details.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className={h2}>{tx("Detalii", "Details")}</h2>
              <dl className="divide-y divide-line rounded-card border border-line bg-surface">
                {details.map((d, i) => (
                  <div key={i} className="flex flex-col gap-0.5 px-4 py-3">
                    {d.label && <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{d.label}</dt>}
                    <dd className="leading-snug">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {(c.presenter || bio.length > 0) && (
            <section className="flex flex-col gap-3">
              <h2 className={h2}>{tx("Prezentator", "Presenter")}</h2>
              {c.presenter && <p className="font-semibold">{c.presenter}</p>}
              {bio.map((t, i) => <p key={i} className="text-sm leading-relaxed text-muted">{t}</p>)}
            </section>
          )}
        </aside>
      </div>

      {(others ?? []).length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className={h2}>{tx("Alte cursuri", "More courses")}</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(others ?? []).map((o) => {
              const oi = courseImage(o as { cover_path: string | null; cover_url: string | null });
              return (
                <li key={o.slug}>
                  <Link href={`/cursuri/${o.slug}`} className="flex items-center gap-4 rounded-card border border-line bg-surface p-3 transition-colors hover:border-accent">
                    <div className="size-20 shrink-0 overflow-hidden rounded-control bg-surface2">
                      {oi && (
                        // eslint-disable-next-line @next/next/no-img-element -- external or storage image
                        <img src={oi} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover" />
                      )}
                    </div>
                    <span className="font-semibold leading-snug">{pick(locale, o.title as string, o.title_en as string)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className={cn("fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:hidden")}>
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold">{formatLei(p.member)}</span>
          <span className="text-xs text-muted">{tx("TVA inclus", "VAT included")}</span>
        </div>
        <a href={c.shop_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-ink">
          {label} <ArrowUpRight size={16} aria-hidden />
        </a>
      </div>
    </div>
  );
}
