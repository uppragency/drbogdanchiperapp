import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FaqBrowser, type FaqEntry } from "./faq-browser";
import { getLocale, getTx, pick } from "@/lib/i18n";
import { loadChangelog } from "@/lib/changelog-feed";
import { formatDate } from "@/lib/format";
import { ChatsCircle, EnvelopeSimple, Phone, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

export async function generateMetadata(): Promise<Metadata> {
  const tx = await getTx();
  return { title: tx("Întrebări frecvente", "Frequently asked questions"), description: tx("Răspunsuri despre cont, parolă, resurse, comentarii și acces în platforma MentorMed.", "Answers about your account, password, resources, comments and access in the MentorMed platform.") };
}

const isFresh = (iso: string | null) => !!iso && new Date(iso).getTime() > Date.now();
const card = "rounded-card border border-line bg-surface p-6 shadow-card";
const rowLink = "flex min-h-11 items-center gap-3 rounded-control px-2 text-sm font-semibold transition-colors hover:bg-surface2";

export default async function FaqPage() {
  const viewer = await requireUser();
  const [tx, locale] = await Promise.all([getTx(), getLocale()]);
  const supabase = await createClient();
  const [{ data }, { data: votes }, news] = await Promise.all([
    supabase.from("faq_items").select("id,question,question_en,answer,answer_en,category,is_featured,link_href,link_label,link_label_en,new_until").eq("is_published", true).order("position").order("created_at"),
    supabase.from("faq_feedback").select("faq_id,helpful").eq("user_id", viewer.id),
    loadChangelog(supabase),
  ]);
  const voteOf = new Map((votes ?? []).map((v) => [v.faq_id as string, v.helpful as boolean]));
  const items: FaqEntry[] = (data ?? []).map((f) => ({
    id: f.id,
    category: f.category,
    featured: f.is_featured,
    isNew: isFresh(f.new_until),
    vote: voteOf.get(f.id) ?? null,
    question: pick(locale, f.question, f.question_en),
    answer: pick(locale, f.answer, f.answer_en),
    linkHref: f.link_href,
    linkLabel: f.link_href ? pick(locale, f.link_label, f.link_label_en) : null,
  }));
  const wa = `https://wa.me/40746020724?text=${encodeURIComponent(tx("Bună ziua! Am o întrebare despre platforma MentorMed.", "Hello! I have a question about the MentorMed platform."))}`;

  const sidebar = (
    <>
      <section className={card}>
        <h2 className="text-lg font-bold">{tx("Ai nevoie de ajutor?", "Need help?")}</h2>
        <p className="mt-1 text-sm text-muted">{tx("Răspundem în zilele lucrătoare.", "We reply on working days.")}</p>
        <ul className="mt-3 flex flex-col">
          <li><Link href="/contact" className={rowLink}><EnvelopeSimple size={20} aria-hidden />{tx("Scrie-ne un mesaj", "Send us a message")}</Link></li>
          <li><a href={wa} target="_blank" rel="noopener noreferrer" className={rowLink}><WhatsappLogo size={20} aria-hidden />WhatsApp</a></li>
          <li><a href="tel:+40746020724" className={rowLink}><Phone size={20} aria-hidden />0746 020 724</a></li>
          <li><Link href="/feed?categorie=intrebari-si-raspunsuri" className={rowLink}><ChatsCircle size={20} aria-hidden />{tx("Întreabă comunitatea", "Ask the community")}</Link></li>
        </ul>
      </section>
      <section className={card}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{tx("Noutăți din platformă", "Platform news")}</h2>
        <ul className="mt-4 flex flex-col divide-y divide-line">
          {news.slice(0, 3).map((e) => (
            <li key={`${e.date}-${e.title.ro}`} className="pb-3 pt-[5px] first:pt-0 last:pb-0">
              <Link href={e.href ?? "/ce-e-nou"} className="flex flex-col gap-1 hover:text-accent">
                <span className="text-sm font-semibold leading-snug">{tx(e.title.ro, e.title.en)}</span>
                <span className="text-xs text-muted">{formatDate(`${e.date}T12:00:00Z`, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/ce-e-nou" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline">{tx("Vezi toate noutățile", "See all news")}</Link>
      </section>
    </>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Întrebări frecvente", "Frequently asked questions")}</h1>
      {items.length > 0 ? <FaqBrowser items={items} sidebar={sidebar} /> : <p className="rounded-card border border-line bg-surface p-6 text-sm text-muted">{tx("Întrebările frecvente vor fi adăugate în curând.", "Frequently asked questions will be added soon.")}</p>}
    </div>
  );
}
