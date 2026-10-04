import { cookies } from "next/headers";
import { dictionaries, type Dict, type Locale } from "@/lib/texts";

export type { Locale };
export const LANG_COOKIE = "lang";

export async function getLocale(): Promise<Locale> {
  return (await cookies()).get(LANG_COOKIE)?.value === "en" ? "en" : "ro";
}

export async function getT(): Promise<Dict> {
  return dictionaries[await getLocale()];
}

// Inline pair for strings that live next to the markup: tx("Căutare", "Search").
export type Tx = (ro: string, en: string) => string;
export async function getTx(): Promise<Tx> {
  const l = await getLocale();
  return (ro, en) => (l === "en" ? en : ro);
}

// Content written in both languages: falls back to Romanian when the English field is empty.
export const pick = (locale: Locale, ro: string, en?: string | null) => (locale === "en" && en && en.trim() ? en : ro);
