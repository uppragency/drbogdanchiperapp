"use client";
import { createContext, useContext, type ReactNode } from "react";
import { dictionaries, type Dict, type Locale } from "@/lib/texts";

const Ctx = createContext<Locale>("ro");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);
export const useT = (): Dict => dictionaries[useContext(Ctx)];
export function useTx() {
  const l = useContext(Ctx);
  return (ro: string, en: string) => (l === "en" ? en : ro);
}
