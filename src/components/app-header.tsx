import Link from "next/link";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { logout } from "@/app/actions";
import { cn } from "@/components/ui";
import { t } from "@/lib/texts";

export function AppHeader({ isAdmin, active }: { isAdmin: boolean; active: "feed" | "profile" | "admin" }) {
  const link = (key: typeof active, href: string, label: string) => (
    <Link href={href} aria-current={active === key ? "page" : undefined} className={cn("rounded-control px-3 py-2 text-sm font-semibold transition", active === key ? "bg-surface2 text-ink" : "text-muted hover:text-ink")}>
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/feed" className="text-lg font-bold tracking-tight">
          {t.brand}
        </Link>
        <nav className="flex items-center gap-1" aria-label="Navigare principală">
          {link("feed", "/feed", t.nav.feed)}
          {link("profile", "/profil", t.nav.profile)}
          {isAdmin && link("admin", "/admin", t.nav.admin)}
          <form action={logout}>
            <button type="submit" aria-label={t.nav.logout} title={t.nav.logout} className="ml-1 flex size-11 items-center justify-center rounded-control text-muted transition hover:bg-surface2 hover:text-ink">
              <SignOut size={20} weight="regular" />
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
