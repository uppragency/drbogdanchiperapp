import { coverUrl } from "@/lib/cover-url";

const NEW_DAYS = 30;

export type Course = {
  id: string; slug: string;
  title: string; title_en: string;
  short_description: string; short_description_en: string;
  long_description: string; long_description_en: string;
  benefits: string; benefits_en: string;
  includes: string; includes_en: string;
  details: string; details_en: string;
  presenter: string; presenter_bio: string; presenter_bio_en: string;
  price: number; offer_price: number | null; offer_until: string | null;
  member_discount: number; member_code: string;
  shop_url: string; button_label: string; button_label_en: string;
  cover_path: string | null; cover_url: string | null;
  position: number; is_published: boolean; published_at: string | null; announce: boolean;
};

export const COURSE_COLUMNS =
  "id,slug,title,title_en,short_description,short_description_en,long_description,long_description_en,benefits,benefits_en,includes,includes_en,details,details_en,presenter,presenter_bio,presenter_bio_en,price,offer_price,offer_until,member_discount,member_code,shop_url,button_label,button_label_en,cover_path,cover_url,position,is_published,published_at,announce";

export function normalizeCourse(r: Record<string, unknown>): Course {
  return { ...(r as unknown as Course), price: Number(r.price), offer_price: r.offer_price == null ? null : Number(r.offer_price) };
}

const cents = (n: number) => Math.round(n * 100) / 100;

export type Pricing = {
  /** Regular price (VAT included) shown crossed out, only when something reduces it. */
  struck: number | null;
  /** Price with VAT the member pays (member discount already applied). */
  member: number;
  /** Price with VAT without the member discount (offer price when active). */
  list: number;
  offerActive: boolean;
  offerUntil: string | null;
  discount: number;
};

export function pricing(c: Course, now = new Date()): Pricing {
  // Shop prices already include VAT (21%). The member discount is applied on top of the current price.
  const offerActive = c.offer_price != null && !!c.offer_until && new Date(c.offer_until) > now;
  const list = cents(offerActive ? (c.offer_price as number) : c.price);
  const member = cents(list * (1 - c.member_discount / 100));
  const regular = cents(c.price);
  return { struck: member < regular ? regular : null, member, list, offerActive, offerUntil: offerActive ? c.offer_until : null, discount: c.member_discount };
}

export const formatLei = (n: number) => `${new Intl.NumberFormat("ro-RO", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n)} lei`;

export const lines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export function detailRows(s: string) {
  return lines(s).map((l) => {
    const i = l.indexOf(":");
    return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { label: "", value: l };
  });
}

export const isNew = (c: Course, now = Date.now()) => !!c.published_at && now - new Date(c.published_at).getTime() < NEW_DAYS * 86400000;

export const courseImage = (c: Pick<Course, "cover_path" | "cover_url">) => (c.cover_path ? coverUrl(c.cover_path) : c.cover_url);

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
