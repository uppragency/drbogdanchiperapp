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
import { computeStreaks } from "@/lib/streak";
import { FollowButton } from "@/components/follow-button";
import { PushToggle } from "@/app/(app)/profil/push-toggle";

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

  // Same visibility rules as the feed; group access is enforced by row level security.
  const nowIso = new Date().toISOString();
  const [{ data: catRows }, { data: visibleRows }, { data: viewRows }, { data: subRows }, { data: dayRows }] = await Promise.all([
    supabase.from("categories").select("id,name,name_en,slug").order("position"),
    supabase
      .from("resources")
      .select("id,title,title_en,category_id")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
      .limit(2000),
    supabase.from("resource_views").select("resource_id,completed,last_viewed_at").eq("user_id", viewer.id).order("last_viewed_at", { ascending: false }).limit(2000),
    supabase.from("category_subscriptions").select("category_id").eq("user_id", viewer.id),
    supabase.from("activity_days").select("day").eq("user_id", viewer.id).order("day", { ascending: false }).limit(800),
  ]);
  type VisRes = { id: string; title: string; title_en: string | null; category_id: string };
  const visible = (visibleRows ?? []) as VisRes[];
  const doneIds = new Set(((viewRows ?? []) as { resource_id: string; completed: boolean }[]).filter((v) => v.completed).map((v) => v.resource_id));
  const followed = new Set(((subRows ?? []) as { category_id: string }[]).map((s) => s.category_id));
  const progress = ((catRows ?? []) as { id: string; name: string; name_en: string | null }[])
    .map((c) => {
      const inCat = visible.filter((r) => r.category_id === c.id);
      return { id: c.id, name: pick(locale, c.name, c.name_en), total: inCat.length, done: inCat.filter((r) => doneIds.has(r.id)).length, following: followed.has(c.id) };
    })
    .filter((c) => c.total > 0 || c.following);
  const catName = new Map(progress.map((c) => [c.id, c.name]));
  const visibleById = new Map(visible.map((r) => [r.id, r]));
  const resumeView = ((viewRows ?? []) as { resource_id: string; completed: boolean }[]).find((v) => !v.completed && visibleById.has(v.resource_id));
  const resumeRes = resumeView ? visibleById.get(resumeView.resource_id) : undefined;
  const streak = computeStreaks(((dayRows ?? []) as { day: string }[]).map((d) => d.day));

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
            <h2 className="mb-4 text-lg font-bold">{tx("Zile consecutive", "Day streak")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-2xl border border-line bg-bg px-4 py-4">
                <span className="text-3xl font-bold leading-none">{streak.current}</span>
                <span className="text-xs text-muted">{tx("Seria curentă", "Current streak")}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-2xl border border-line bg-bg px-4 py-4">
                <span className="text-3xl font-bold leading-none">{streak.longest}</span>
                <span className="text-xs text-muted">{tx("Cea mai lungă serie", "Longest streak")}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted">
              {streak.current === 0
                ? tx("Deschide o resursă azi ca să începi o serie.", "Open a resource today to start a streak.")
                : streak.activeToday
                  ? tx("Bravo, ai fost activ și azi. Revino mâine ca să continui seria.", "Nice, you were active today too. Come back tomorrow to keep it going.")
                  : tx("Deschide o resursă azi ca să continui seria.", "Open a resource today to keep your streak going.")}
            </p>
          </Card>

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

          <Card className="flex flex-col gap-4 md:p-6">
            <h2 className="text-lg font-bold">{tx("Notificări pe telefon", "Phone notifications")}</h2>
            <PushToggle />
          </Card>

          <Devices userId={viewer.id} currentSession={viewer.sessionId} />
        </div>

        <div className="flex flex-col gap-6">
          {resumeRes && (
            <Card className="md:p-6">
              <h2 className="mb-3 text-lg font-bold">{tx("Continuă de unde ai rămas", "Continue where you left off")}</h2>
              <Link href={`/resurse/${resumeRes.id}`} className="group flex min-h-11 items-center gap-3 rounded-control">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold group-hover:text-accent">{pick(locale, resumeRes.title, resumeRes.title_en)}</span>
                  {catName.get(resumeRes.category_id) && <span className="text-sm text-muted">{catName.get(resumeRes.category_id)}</span>}
                </span>
                <span className="shrink-0 text-sm font-semibold text-accent">{tx("Deschide", "Open")}</span>
              </Link>
            </Card>
          )}

          <Card className="md:p-6">
            <h2 className="text-lg font-bold">{tx("Progres pe categorii", "Progress by category")}</h2>
            <p className="mb-4 mt-1 text-sm text-muted">{tx("Urmărește categoriile care te interesează ca să primești notificări doar pentru ele.", "Follow the categories you care about to get notifications only for them.")}</p>
            {progress.length === 0 ? (
              <p className="text-sm text-muted">{tx("Nu există resurse disponibile încă.", "No resources available yet.")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {progress.map((c) => {
                  const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
                  return (
                    <li key={c.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-semibold">{c.name}</span>
                        <FollowButton categoryId={c.id} initial={c.following} />
                      </div>
                      <div
                        role="progressbar"
                        aria-label={c.name}
                        aria-valuemin={0}
                        aria-valuemax={c.total}
                        aria-valuenow={c.done}
                        className="h-1.5 w-full overflow-hidden rounded-full bg-surface2"
                      >
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted">{tx(`${c.done} din ${c.total} terminate`, `${c.done} of ${c.total} completed`)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

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
