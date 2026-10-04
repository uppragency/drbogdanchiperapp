import Link from "next/link";
import { getT } from "@/lib/i18n";
import { LangSwitch } from "@/components/lang-switch";
import { Wordmark } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";
import { HeaderShell } from "@/components/header-shell";
import { NotificationsPopup, SearchPopup } from "@/components/header-popups";
import { NavLinks, type NavItem } from "@/components/nav-links";


export async function AppHeader({ isAdmin, unread = 0, initials = "?", name = "", email = "" }: { isAdmin: boolean; unread?: number; initials?: string; name?: string; email?: string }) {
  const t = await getT();
  const items: NavItem[] = [
    { href: "/feed", label: t.nav.feed, match: ["/feed", "/resurse", "/cauta", "/recente"] },
    { href: "/profil", label: t.nav.profile, match: ["/profil"] },
    ...(isAdmin ? [{ href: "/admin", label: t.nav.admin, match: ["/admin"] }] : []),
  ];
  return (
    <HeaderShell>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="relative flex h-12 items-center justify-between gap-2">
          <Link href="/feed" aria-label={t.brand} className="shrink-0">
            <Wordmark />
          </Link>
          <div className="hidden md:block">
            <NavLinks items={items} />
          </div>
          <div className="flex items-center">
            <LangSwitch className="mr-1" />
            <SearchPopup />
            <NotificationsPopup unread={unread} />
            <UserMenu initials={initials} name={name} email={email} isAdmin={isAdmin} />
          </div>
        </div>
        <div className="md:hidden">
          <NavLinks items={items} />
        </div>
      </div>
    </HeaderShell>
  );
}
