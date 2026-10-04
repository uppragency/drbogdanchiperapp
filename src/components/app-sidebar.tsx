"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { House, SignOut, SquaresFour, UserCircle } from "@phosphor-icons/react";
import { logout } from "@/app/actions";
import { cn } from "@/components/ui";
import { Wordmark } from "@/components/brand";
import { CategoryIcon } from "@/lib/category-icons";
import { t } from "@/lib/texts";

export type SidebarProps = {
  isAdmin: boolean;
  name: string;
  email: string;
  categories: { id: string; name: string; slug: string }[];
  newByCategory: Record<string, number>;
  newTotal: number;
};

function useActive() {
  const path = usePathname();
  const cat = useSearchParams().get("categorie");
  return { path, cat };
}

// Fixed left navigation on desktop.
export function AppSidebar({ isAdmin, name, email, categories, newByCategory, newTotal }: SidebarProps) {
  const { path, cat } = useActive();
  const home = path === "/feed" && !cat;
  const initials = (name || email).trim().slice(0, 1).toUpperCase();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="px-6 pb-4 pt-6">
        <Link href="/feed" aria-label={t.brand}><Wordmark /></Link>
      </div>

      <nav aria-label="Navigare principală" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        <Item href="/feed" active={home} icon={<House size={20} weight={home ? "fill" : "regular"} />} label="Acasă" count={newTotal} />
        <p className="px-3 pb-1 pt-5 text-xs font-bold uppercase tracking-wider text-muted">{t.home.categories}</p>
        {categories.map((c) => {
          const active = path === "/feed" && cat === c.slug;
          return <Item key={c.id} href={`/feed?categorie=${c.slug}`} active={active} icon={<CategoryIcon slug={c.slug} size={20} weight={active ? "fill" : "regular"} />} label={c.name} count={newByCategory[c.id] ?? 0} />;
        })}
        <p className="px-3 pb-1 pt-5 text-xs font-bold uppercase tracking-wider text-muted">Cont</p>
        <Item href="/profil" active={path.startsWith("/profil")} icon={<UserCircle size={20} weight={path.startsWith("/profil") ? "fill" : "regular"} />} label={t.nav.profile} />
        {isAdmin && <Item href="/admin" active={false} icon={<SquaresFour size={20} />} label={t.nav.admin} />}
      </nav>

      <div className="flex items-center gap-3 border-t border-line p-4">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">{initials}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold">{name || email}</span>
          <span className="truncate text-xs text-muted">{isAdmin ? "Administrator" : "Membru"}</span>
        </span>
        <form action={logout}>
          <button type="submit" aria-label={t.nav.logout} title={t.nav.logout} className="flex size-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface2 hover:text-ink">
            <SignOut size={20} />
          </button>
        </form>
      </div>
    </aside>
  );
}

function Item({ href, active, icon, label, count = 0 }: { href: string; active: boolean; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors", active ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface2 hover:text-ink")}>
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count > 0 && <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", active ? "bg-white/20 text-white" : "bg-violet text-white")}>{count}</span>}
    </Link>
  );
}

// Mobile: slim top bar and a bottom tab bar.
export function MobileBars({ isAdmin }: { isAdmin: boolean }) {
  const { path, cat } = useActive();
  const tab = (href: string, active: boolean, icon: React.ReactNode, label: string) => (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors", active ? "text-accent" : "text-muted")}>
      {icon}
      {label}
    </Link>
  );
  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Link href="/feed" aria-label={t.brand}><Wordmark /></Link>
        <form action={logout}>
          <button type="submit" aria-label={t.nav.logout} className="flex size-11 items-center justify-center rounded-control text-muted hover:text-ink"><SignOut size={20} /></button>
        </form>
      </header>
      <nav aria-label="Navigare" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {tab("/feed", path === "/feed" && !cat, <House size={22} weight={path === "/feed" && !cat ? "fill" : "regular"} />, "Acasă")}
        {tab("/profil", path.startsWith("/profil"), <UserCircle size={22} weight={path.startsWith("/profil") ? "fill" : "regular"} />, t.nav.profile)}
        {isAdmin && tab("/admin", false, <SquaresFour size={22} />, "Admin")}
      </nav>
    </>
  );
}
