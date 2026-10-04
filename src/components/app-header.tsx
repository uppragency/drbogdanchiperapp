import Link from "next/link";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { logout } from "@/app/actions";
import { t } from "@/lib/texts";
import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderShell } from "@/components/header-shell";
import { NotificationsPopup, SearchPopup } from "@/components/header-popups";
import { NavLinks, type NavItem } from "@/components/nav-links";

const iconBtn = "relative flex size-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface2 hover:text-ink";

export function AppHeader({ isAdmin, unread = 0 }: { isAdmin: boolean; unread?: number }) {
  const items: NavItem[] = [
    { href: "/feed", label: t.nav.feed, match: ["/feed", "/resurse", "/cauta", "/recente"] },
    { href: "/colectii", label: "Colecții", match: ["/colectii"] },
    { href: "/calendar", label: "Calendar", match: ["/calendar"] },
    { href: "/profil", label: t.nav.profile, match: ["/profil"] },
    ...(isAdmin ? [{ href: "/admin", label: t.nav.admin, match: ["/admin"] }] : []),
  ];
  return (
    <HeaderShell>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="relative flex h-16 items-center justify-between gap-2">
          <Link href="/feed" aria-label={t.brand} className="shrink-0">
            <Wordmark />
          </Link>
          <div className="hidden md:block">
            <NavLinks items={items} />
          </div>
          <div className="flex items-center">
            <SearchPopup />
            <NotificationsPopup unread={unread} />
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" aria-label={t.nav.logout} title={t.nav.logout} className={iconBtn}>
                <SignOut size={20} />
              </button>
            </form>
          </div>
        </div>
        <div className="md:hidden">
          <NavLinks items={items} />
        </div>
      </div>
    </HeaderShell>
  );
}
