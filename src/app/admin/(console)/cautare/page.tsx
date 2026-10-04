import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageTitle } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Căutare în administrare" };

export default async function AdminSearch({ searchParams }: PageProps<"/admin/cautare">) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const needle = q.replace(/[%,()*\\]/g, " ").trim();
  const supabase = await createClient();

  const [users, resources, messages] = needle.length >= 2
    ? await Promise.all([
        supabase.from("profiles").select("id,email,first_name,last_name,is_active,deleted_at").eq("role", "user").or(`email.ilike.%${needle}%,first_name.ilike.%${needle}%,last_name.ilike.%${needle}%`).order("created_at", { ascending: false }).limit(10),
        supabase.from("resources").select("id,title,status,presenter,deleted_at").or(`title.ilike.%${needle}%,presenter.ilike.%${needle}%,description.ilike.%${needle}%`).order("created_at", { ascending: false }).limit(10),
        supabase.from("contact_messages").select("id,subject,message,created_at,handled_at").or(`subject.ilike.%${needle}%,message.ilike.%${needle}%`).order("created_at", { ascending: false }).limit(10),
      ])
    : [null, null, null];

  const u = users?.data ?? [];
  const r = resources?.data ?? [];
  const m = messages?.data ?? [];
  const none = needle.length >= 2 && !u.length && !r.length && !m.length;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Căutare" />
      <form action="/admin/cautare" role="search" className="relative">
        <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} autoFocus placeholder="Useri, resurse, prezentatori sau mesaje" aria-label="Caută în administrare" className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-base placeholder:text-muted focus:border-accent focus:outline-none" />
      </form>

      {!q && <p className="text-sm text-muted">Caută după nume sau email, titlul resursei, prezentator sau textul unui mesaj.</p>}
      {q && needle.length < 2 && <p className="text-sm text-muted">Scrie cel puțin 2 caractere.</p>}
      {none && <EmptyState icon={MagnifyingGlass} title="Nicio potrivire" text={`Nu am găsit nimic pentru „${q}”.`} />}

      {u.length > 0 && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Useri</h2>
          <ul className="divide-y divide-line">
            {u.map((x) => (
              <li key={x.id}>
                <Link href={`/admin/useri/${x.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-accent">
                  <span className="font-semibold">{`${x.first_name} ${x.last_name}`.trim() || x.email}<span className="ml-2 text-sm font-normal text-muted">{x.email}</span></span>
                  {x.deleted_at ? <Badge tone="danger">Șters</Badge> : !x.is_active && <Badge tone="warn">Pe pauză</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {r.length > 0 && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Resurse</h2>
          <ul className="divide-y divide-line">
            {r.map((x) => (
              <li key={x.id}>
                <Link href={`/admin/resurse/${x.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-accent">
                  <span className="font-semibold">{x.title}{x.presenter && <span className="ml-2 text-sm font-normal text-muted">{x.presenter}</span>}</span>
                  {x.deleted_at ? <Badge tone="danger">Coș</Badge> : <Badge tone={x.status === "published" ? "ok" : "neutral"}>{x.status === "published" ? "Publicat" : "Draft"}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {m.length > 0 && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Mesaje</h2>
          <ul className="divide-y divide-line">
            {m.map((x) => (
              <li key={x.id}>
                <Link href="/admin/mesaje" className="flex flex-col gap-1 py-3 hover:text-accent">
                  <span className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{x.subject || "Fără subiect"}</span><span className="text-xs text-muted">{formatDate(x.created_at)}</span></span>
                  <span className="line-clamp-2 text-sm text-muted">{x.message}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
