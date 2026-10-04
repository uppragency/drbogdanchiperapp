import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, fullName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, LinkButton } from "@/components/ui";
import { ProfileForm } from "./profile-form";
import { Devices } from "./devices";
import { CountUp } from "@/components/count-up";
import { logout } from "@/app/actions";
import { t } from "@/lib/texts";

export const metadata: Metadata = { title: t.profile.title };

const fmt = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : null;

export default async function ProfilePage() {
  const viewer = await requireUser();
  const supabase = await createClient();

  const [{ data: prof }, { data: tagRows }, { data: favRows }, views, comments, favCount] = await Promise.all([
    supabase.from("profiles").select("created_at,access_expires_at").eq("id", viewer.id).maybeSingle(),
    supabase.from("user_tags").select("tags(name,position)").eq("user_id", viewer.id),
    supabase
      .from("favorites")
      .select("resource_id,created_at,resources(id,title)")
      .eq("user_id", viewer.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("resource_views").select("resource_id", { count: "exact", head: true }).eq("user_id", viewer.id),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", viewer.id),
    supabase.from("favorites").select("resource_id", { count: "exact", head: true }).eq("user_id", viewer.id),
  ]);

  const tags = ((tagRows ?? []) as unknown as { tags: { name: string; position: number } | null }[])
    .map((r) => r.tags)
    .filter((x): x is { name: string; position: number } => !!x)
    .sort((a, b) => a.position - b.position);

  const favorites = ((favRows ?? []) as unknown as { resources: { id: string; title: string } | null }[])
    .map((r) => r.resources)
    .filter((x): x is { id: string; title: string } => !!x);

  const name = fullName(viewer) || viewer.email;
  const initials =
    ((viewer.firstName?.[0] ?? "") + (viewer.lastName?.[0] ?? "")).toUpperCase() || viewer.email[0]?.toUpperCase() || "?";

  const expires = prof?.access_expires_at ?? null;
  const expired = expires ? new Date(expires).getTime() < new Date().getTime() : false;

  const stats = [
    { label: "Resurse deschise", value: views.count ?? 0 },
    { label: "Comentarii", value: comments.count ?? 0 },
    { label: "Favorite", value: favCount.count ?? 0 },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <header className="flex min-w-0 items-center gap-4">
          <div
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-ink"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">{name}</h1>
            <p className="truncate text-sm text-muted">{viewer.email}</p>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((g) => (
                  <Badge key={g.name}>{g.name}</Badge>
                ))}
              </div>
            )}
          </div>
        </header>

        <dl className="grid grid-cols-3 gap-3 lg:w-[28rem]">
          {stats.map((s) => (
            <div key={s.label} className="rounded-card border border-line bg-surface p-4 text-center">
              <dd className="text-2xl font-bold"><CountUp value={s.value} /></dd>
              <dt className="mt-1 text-xs text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Card className="md:p-6">
            <h2 className="mb-5 text-lg font-bold">Date personale</h2>
            <ProfileForm firstName={viewer.firstName} lastName={viewer.lastName} email={viewer.email} />
          </Card>

          <Card className="flex flex-col gap-4 md:p-6">
            <div>
              <h2 className="text-lg font-bold">Securitate</h2>
              <p className="mt-1 text-sm text-muted">Alege o parolă nouă de cel puțin 10 caractere.</p>
            </div>
            <LinkButton href="/setare-parola" variant="secondary" className="self-start">
              {t.profile.changePassword}
            </LinkButton>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="md:p-6">
            <h2 className="mb-4 text-lg font-bold">Acces</h2>
            <ul className="divide-y divide-line text-sm">
              <li className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-muted">Membru din</span>
                <span className="font-semibold">{fmt(prof?.created_at) ?? "Nespecificat"}</span>
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-muted">Acces activ până la</span>
                <span className="flex items-center gap-2 font-semibold">
                  {expires ? fmt(expires) : "Fără dată de expirare"}
                  {expired && <Badge tone="danger">Expirat</Badge>}
                </span>
              </li>
            </ul>
          </Card>

          <Devices userId={viewer.id} currentSession={viewer.sessionId} />
        </div>

        <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-1">
          <Card className="md:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">Favorite recente</h2>
              {favorites.length > 0 && (
                <Link href="/feed?fav=1" className="text-sm font-semibold text-accent hover:underline">
                  Vezi toate
                </Link>
              )}
            </div>
            {favorites.length === 0 ? (
              <p className="text-sm text-muted">Nu ai resurse favorite încă. Apasă inima de pe o resursă ca să o găsești rapid aici.</p>
            ) : (
              <ul className="divide-y divide-line">
                {favorites.map((f) => (
                  <li key={f.id}>
                    <Link href={`/resurse/${f.id}`} className="block py-3 text-sm font-semibold hover:text-accent">
                      {f.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="flex flex-wrap items-center justify-between gap-4 md:p-6">
            <div>
              <h2 className="text-lg font-bold">Văzute recent</h2>
              <p className="mt-1 text-sm text-muted">Ultimele 20 de resurse deschise.</p>
            </div>
            <LinkButton href="/recente" variant="secondary">Deschide lista</LinkButton>
          </Card>

          <form action={logout} className="self-start">
            <button type="submit" className="min-h-11 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
              {t.nav.logout}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
