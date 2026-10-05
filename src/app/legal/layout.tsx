import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { LangSwitch } from "@/components/lang-switch";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex h-[53px] w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="MentorMed"><Wordmark /></Link>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </>
  );
}
