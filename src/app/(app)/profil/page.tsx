import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, fullName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, LinkButton } from "@/components/ui";
import { ProfileForm } from "./profile-form";
import { Devices } from "./devices";
import { CountUp } from "@/components/count-up";
import { logout } from "@/app/actions";
import { getLocale, getT, getTx, pick } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).profile.title };
}

export default async function ProfilePage() {
  const viewer = await requireUser();
  const t = await getT();
  const tx = await getTx();
  const locale = await getLocale();
  const fmt = (iso: string | null | undefined) =>
    iso ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : null;
  const supabase = await createClient();

  const [{ data: prof }, { data: tagRows }, { data: favRows }, views, comments, favCount] = await Promise.all([
    supabase.from("profiles").select("created_at,access_expires_at,specialty,city").eq("id", viewer.id).maybeSingle(),
    supabase.from("user_tags").select("tags(name,position)").eq("user_id", viewer.id),
    supabase
      .from("favorites")
      .select("resource_id,created_at,resources(id,title,title_en)")
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

  const favorites = ((favRows ?? []) as unknown as { resources: { id: string; title: string; title_en: string | null } | null }[])
    .map((r) => r.resources)
    .filter((x): x is { id: string; title: string; title_en: string | null } => !!x);

  const name = fullName(viewer) || viewer.email;
  const initials =
    ((viewer.firstName?.[0] ?? "") + (viewer.lastName?.[0] ?? "")).toUpperCase() || viewer.email[0]?.toUpperCase() || "?";

  const expires = prof?.access_expires_at ?? null;
  const expired = expires ? new Date(expires).getTime() < new Date().getTime() : false;

  const stats = [
    { label: tx("Resurse deschise", "Resources opened"), value: views.count ?? 0 },
    { label: tx("Comentarii", "Comments"), value: comments.count ?? 0 },
    { label: tx("Favorite", "Favourites"), value: favCount.count ?? 0 },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
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

        <dl className="grid grid-cols-3 gap-3 lg:w-[26rem]">
          {stats.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-surface px-2 py-4 text-center">
              <dd className="text-2xl font-bold leading-none"><CountUp value={s.value} /></dd>
              <dt className="text-xs leading-tight text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="md:p-6">
            <h2 className="mb-5 text-lg font-bold">{tx("Date personale", "Personal details")}</h2>
            <ProfileForm firstName={viewer.firstName} lastName={viewer.lastName} email={viewer.email} specialty={prof?.specialty ?? ""} city={prof?.city ?? ""} />
          </Card>


          <Card className="md:p-6">
            <h2 className="mb-4 text-lg font-bold">{tx("Acces", "Access")}</h2>
            <ul className="divide-y divide-line text-sm">
              <li className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-muted">{tx("Membru din", "Member since")}</span>
                <span className="font-semibold">{fmt(prof?.created_at) ?? tx("Nespecificat", "Not specified")}</span>
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-muted">{tx("Acces activ până la", "Access active until")}</span>
                <span className="flex items-center gap-2 font-semibold">
                  {expires ? fmt(expires) : tx("Fără dată de expirare", "No expiry date")}
                  {expired && <Badge tone="danger">{tx("Expirat", "Expired")}</Badge>}
                </span>
              </li>
            </ul>
          </Card>

          <Card className="flex flex-col gap-4 md:p-6">
            <div>
              <h2 className="text-lg font-bold">{tx("Securitate", "Security")}</h2>
              <p className="mt-1 text-sm text-muted">{tx("Alege o parolă nouă de cel puțin 10 caractere.", "Choose a new password of at least 10 characters.")}</p>
            </div>
            <LinkButton href="/setare-parola" variant="secondary" className="self-start">
              {t.profile.changePassword}
            </LinkButton>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="md:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">{tx("Favorite recente", "Recent favourites")}</h2>
              {favorites.length > 0 && (
                <Link href="/feed?fav=1" className="text-sm font-semibold text-accent hover:underline">
                  {tx("Vezi toate", "View all")}
                </Link>
              )}
            </div>
            {favorites.length === 0 ? (
              <p className="text-sm text-muted">{tx("Nu ai resurse favorite încă. Apasă inima de pe o resursă ca să o găsești rapid aici.", "You have no favourite resources yet. Tap the heart on a resource to find it quickly here.")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {favorites.map((f) => (
                  <li key={f.id}>
                    <Link href={`/resurse/${f.id}`} className="block py-3 text-sm font-semibold hover:text-accent">
                      {pick(locale, f.title, f.title_en)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="flex flex-wrap items-center justify-between gap-4 md:p-6">
            <div>
              <h2 className="text-lg font-bold">{tx("Văzute recent", "Recently viewed")}</h2>
              <p className="mt-1 text-sm text-muted">{tx("Ultimele 20 de resurse deschise.", "The last 20 resources you opened.")}</p>
            </div>
            <LinkButton href="/recente" variant="secondary">{tx("Deschide lista", "Open list")}</LinkButton>
          </Card>


          <Devices userId={viewer.id} currentSession={viewer.sessionId} />

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
