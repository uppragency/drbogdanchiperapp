"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const items = [
  { href: "/admin", label: "Prezentare", exact: true },
  { href: "/admin/resurse", label: "Resurse" },
  { href: "/admin/useri", label: "Useri" },
  { href: "/admin/invitatii", label: "Invitații" },
  { href: "/admin/cereri", label: "Cereri acces" },
  { href: "/admin/colectii", label: "Colecții" },
  { href: "/admin/grupuri", label: "Grupuri" },
  { href: "/admin/bannere", label: "Bannere" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/mesaje", label: "Mesaje" },
  { href: "/admin/cos", label: "Coș" },
  { href: "/admin/securitate", label: "Securitate" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Administrare" className="-mx-4 flex gap-1 overflow-x-auto px-4">
      {items.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition", active ? "bg-ink text-bg" : "text-muted hover:bg-surface2 hover:text-ink")}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
