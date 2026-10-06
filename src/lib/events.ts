import { coverUrl } from "@/lib/cover-url";
import { formatDate } from "@/lib/format";

export type EventType = "studyclub" | "bookclub" | "mentormed";

export type EventRow = {
  id: string; slug: string; type: EventType;
  title: string; title_en: string;
  short_description: string; short_description_en: string;
  description: string; description_en: string;
  mentors: string; format: "online" | "fizic"; city: string;
  starts_at: string; ends_at: string | null;
  register_url: string; button_label: string; button_label_en: string;
  cover_path: string | null; cover_url: string | null;
  is_published: boolean; published_at: string | null; announce: boolean;
};

export const EVENT_COLUMNS =
  "id,slug,type,title,title_en,short_description,short_description_en,description,description_en,mentors,format,city,starts_at,ends_at,register_url,button_label,button_label_en,cover_path,cover_url,is_published,published_at,announce";

export const EVENT_TYPES: { key: EventType; ro: string; en: string; tagRo: string; tagEn: string; descRo: string; descEn: string }[] = [
  {
    key: "studyclub", ro: "StudyClub", en: "StudyClub",
    tagRo: "Un spațiu clinic de dezbateri, decizii și creștere profesională.",
    tagEn: "A clinical space for debate, decisions and professional growth.",
    descRo: "MentorMed StudyClub este un format lunar de întâlniri online, dedicat medicilor dentiști care vor mai mult decât teorie: cazuri clinice reale, protocoale validate și sprijin aplicat din partea mentorilor.",
    descEn: "MentorMed StudyClub is a monthly online meeting format for dentists who want more than theory: real clinical cases, validated protocols and hands-on support from mentors.",
  },
  {
    key: "bookclub", ro: "BookClub", en: "BookClub",
    tagRo: "Medicina dentară, explorată și prin lectură.",
    tagEn: "Dentistry, explored through reading as well.",
    descRo: "Un spațiu dedicat medicilor dentiști care apreciază și vor să exploreze medicina dentară și prin lectură. BookClub-ul este rezervat exclusiv participanților din programul MentorMed și reunește profesioniști care valorizează ideile, curiozitatea, dialogul și, bineînțeles, lectura.",
    descEn: "A space for dentists who value and want to explore dentistry through reading as well. The BookClub is reserved exclusively for participants of the MentorMed program and brings together professionals who value ideas, curiosity, dialogue and, of course, reading.",
  },
  {
    key: "mentormed", ro: "Evenimente MentorMed", en: "MentorMed events",
    tagRo: "Întâlniri fizice cu mentorii și colegii din program.",
    tagEn: "In-person meetings with mentors and peers from the program.",
    descRo: "Evenimentele fizice MentorMed, precum SuperBootcamp MentorMed, reunesc medici dentiști, mentori și colegi din program într-un spațiu de lucru față în față.",
    descEn: "MentorMed in-person events, such as the MentorMed SuperBootcamp, bring dentists, mentors and peers from the program together for hands-on, face-to-face work.",
  },
];

export const eventType = (k: string) => EVENT_TYPES.find((t) => t.key === k);

export const isUpcoming = (e: Pick<EventRow, "starts_at">, now = Date.now()) => new Date(e.starts_at).getTime() > now;
export const isNewEvent = (e: EventRow, now = Date.now()) => isUpcoming(e, now) && !!e.published_at && now - new Date(e.published_at).getTime() < 30 * 86400000;
export const eventImage = (e: Pick<EventRow, "cover_path" | "cover_url">) => (e.cover_path ? coverUrl(e.cover_path) : e.cover_url);
export const mentorLines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const timeFmt = (locale?: string) => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
export function eventWhen(e: Pick<EventRow, "starts_at" | "ends_at">, locale?: string) {
  const f = timeFmt(locale);
  const start = f.format(new Date(e.starts_at));
  const time = e.ends_at ? `${start} ${locale === "en" ? "to" : "până la"} ${f.format(new Date(e.ends_at))}` : start;
  return `${formatDate(e.starts_at, locale)}, ${time}`;
}

export const placeLabel = (e: Pick<EventRow, "format" | "city">, en: boolean) =>
  e.format === "online" ? "Online" : [en ? "In person" : "Fizic", e.city].filter(Boolean).join(", ");
