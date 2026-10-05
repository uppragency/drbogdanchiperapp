import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, LinkButton, PageTitle, cn } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Useri" };

const STARI = [
  { key: "", label: "Activi" },
  { key: "neinvitati", label: "Neinvitați" },
  { key: "neacceptat", label: "Invitație neacceptată" },
  { key: "expira", label: "Expiră curând" },
  { key: "inactiv", label: "Fără logare 30 zile" },
  { key: "sters", label: "Șterși" },
  { key: "admini", label: "Echipă" },
];

export default async function UsersAdmin({ searchParams }: PageProps<"/admin/useri">) {
  const sp = await searchParams;
  const stare = STARI.find((s) => s.key === sp.stare)?.key ?? "";
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  const PE = [50, 100, 200, 500];
  const PAGE = PE.includes(Number(sp.pe)) ? Number(sp.pe) : 100;
  const pagina = Math.max(1, Math.min(500, Number.parseInt(typeof sp.pagina === "string" ? sp.pagina : "1", 10) || 1));
  const tag = typeof sp.tag === "string" && /^[0-9a-f-]{36}$/.test(sp.tag) ? sp.tag : "";

  const supabase = await createClient();
  const { data: tags } = await supabase.from("tags").select("id,name").order("position");

  const sel = `id,email,role,first_name,last_name,is_active,access_expires_at,last_login_at,deleted_at,user_tags${tag ? "!inner" : ""}(tag_id,tags(name,position)),invitations(sent_at,accepted_at)`;
  let query = supabase.from("profiles").select(sel, { count: "exact" }).order("created_at", { ascending: false }).range((pagina - 1) * PAGE, pagina * PAGE - 1);
  query = stare === "admini" ? query.in("role", ["admin", "moderator"]) : query.eq("role", "user");
  query = stare === "sters" ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (tag) query = query.eq("user_tags.tag_id", tag);
  if (q) query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  const now = new Date();
  if (stare === "expira") query = query.not("access_expires_at", "is", null).lte("access_expires_at", new Date(now.getTime() + 14 * 86400000).toISOString());
  if (stare === "inactiv") query = query.eq("is_active", true).or(`last_login_at.is.null,last_login_at.lt.${new Date(now.getTime() - 30 * 86400000).toISOString()}`);
  if (stare === "neinvitati") query = query.is("invitations.sent_at", null);
  if (stare === "neacceptat") query = query.not("invitations.sent_at", "is", null).is("invitations.accepted_at", null);
  const { data: raw, count } = await query;
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const data = (raw ?? []) as unknown as Row[];
  // Embedded filters on invitations return the parent row with a null child, so drop those here.
  const rows = data.filter((r) => {
    const inv = invOf(r);
    if (stare === "neinvitati") return inv && !inv.sent_at;
    if (stare === "neacceptat") return inv && inv.sent_at && !inv.accepted_at;
    return true;
  });

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    Object.entries({ q, tag, stare, pe: PAGE === 100 ? "" : String(PAGE), pagina: "", ...patch }).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/admin/useri?${s}` : "/admin/useri";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Useri">
        <div className="flex gap-2">
          <LinkButton href="/admin/useri/tag-uri" variant="secondary">Grupuri în masă</LinkButton>
          <LinkButton href="/admin/useri/import" variant="secondary">Import CSV</LinkButton>
          <LinkButton href="/admin/useri/nou">User nou</LinkButton>
        </div>
      </PageTitle>
      <form className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
        {PAGE !== 100 && <input type="hidden" name="pe" value={PAGE} />}
        {stare && <input type="hidden" name="stare" value={stare} />}
        <input name="q" defaultValue={q} placeholder="Caută după nume sau email" aria-label="Caută după nume sau email" className="h-11 rounded-control border border-line bg-surface px-4 text-base focus:border-accent focus:outline-none" />
        <select name="tag" defaultValue={tag} aria-label="Grup" className="h-11 rounded-control border border-line bg-surface px-3 text-base focus:border-accent focus:outline-none">
          <option value="">Toate grupurile</option>
          {(tags ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="h-11 rounded-control border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">Caută</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {STARI.map((s) => (
          <Link key={s.key} href={href({ stare: s.key })} className={cn("rounded-full border px-4 py-2 text-sm font-semibold", stare === s.key ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:text-ink")}>{s.label}</Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>{total} rezultate{pages > 1 ? `, pagina ${pagina} din ${pages}` : ""}</p>
        <p className="flex items-center gap-2">
          Pe pagină:
          {PE.map((n) => (
            <Link key={n} href={href({ pe: n === 100 ? "" : String(n) })} className={cn("rounded-full border px-3 py-1 font-semibold", PAGE === n ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface hover:text-ink")}>{n}</Link>
          ))}
        </p>
      </div>
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {rows.map((r) => {
          const inv = invOf(r);
          const names = r.user_tags.map((x) => x.tags).filter(Boolean).sort((a, b) => a!.position - b!.position).map((x) => x!.name.replace("MentorMed ", "M"));
          const expired = r.access_expires_at && new Date(r.access_expires_at) < now;
          return (
            <li key={r.id}>
              <Link href={`/admin/useri/${r.id}`} className="flex flex-col gap-2 p-4 hover:bg-surface2 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{`${r.first_name} ${r.last_name}`.trim() || "Fără nume"}</span>
                  <span className="text-sm text-muted">{r.email}</span>
                  <span className="text-sm text-muted">{names.join(", ") || "Fără grup"} · {r.last_login_at ? `ultima logare ${formatDate(r.last_login_at)}` : "nelogat"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.role === "admin" && <Badge tone="accent">Admin</Badge>}
                  {r.role === "moderator" && <Badge tone="accent">Moderator</Badge>}
                  {!r.is_active && <Badge tone="warn">Pe pauză</Badge>}
                  {expired && <Badge tone="danger">Expirat</Badge>}
                  {inv && !inv.sent_at && <Badge>Neinvitat</Badge>}
                  {inv?.sent_at && !inv.accepted_at && <Badge tone="accent">Invitat</Badge>}
                </div>
              </Link>
            </li>
          );
        })}
        {rows.length === 0 && <li className="p-6 text-sm text-muted">Niciun user.</li>}
      </ul>
      {pages > 1 && (
        <nav aria-label="Paginare" className="flex items-center justify-between gap-3">
          {pagina > 1 ? <Link href={href({ pagina: String(pagina - 1) })} className="inline-flex h-11 items-center rounded-control border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">Înapoi</Link> : <span />}
          <span className="text-sm text-muted">Pagina {pagina} din {pages}</span>
          {pagina < pages ? <Link href={href({ pagina: String(pagina + 1) })} className="inline-flex h-11 items-center rounded-control border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface2">Înainte</Link> : <span />}
        </nav>
      )}
    </div>
  );
}

type Inv = { sent_at: string | null; accepted_at: string | null };
type Row = {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  access_expires_at: string | null;
  last_login_at: string | null;
  user_tags: { tag_id: string; tags: { name: string; position: number } | null }[];
  invitations: Inv | Inv[] | null;
};
const invOf = (r: Row): Inv | null => (Array.isArray(r.invitations) ? (r.invitations[0] ?? null) : r.invitations);
