import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, fullName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, LinkButton, btn, cn } from "@/components/ui";
import { ProfileForm } from "./profile-form";
import { Devices } from "./devices";
import { CountUp } from "@/components/count-up";
import { logout } from "@/app/actions";
import { getLocale, getT, getTx, pick } from "@/lib/i18n";
import { bucharestToday, computeStreaks } from "@/lib/streak";
import { ActivityMap } from "./activity-map";
import { GoalForm } from "./goal-form";
import { EmailRequest } from "./email-request";
import { FollowButton } from "@/components/follow-button";
import { PushToggle } from "@/app/(app)/profil/push-toggle";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).profile.title };
}

export default async function ProfilePage({ searchParams }: PageProps<"/profil">) {
  const sp = await searchParams;
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
  const [{ data: catRows }, { data: visibleRows }, { data: viewRows }, { data: subRows }, { data: dayRows }, { data: noteRows }, { data: goalRow }] = await Promise.all([
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
    supabase.from("resource_notes").select("resource_id,body,updated_at,resources(id,title,title_en)").eq("user_id", viewer.id).order("updated_at", { ascending: false }).limit(100),
    supabase.from("user_goals").select("weekly_goal").eq("user_id", viewer.id).maybeSingle(),
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

  const TABS = [
    { key: "prezentare", ro: "Prezentare", en: "Overview" },
    { key: "progres", ro: "Progres", en: "Progress" },
    { key: "favorite", ro: "Favorite", en: "Favourites" },
    { key: "notite", ro: "Notițe", en: "Notes" },
    { key: "setari", ro: "Setări", en: "Settings" },
  ] as const;
  const tab = TABS.find((x) => x.key === sp.tab)?.key ?? "prezentare";

  // Statistics, all from data the platform already keeps.
  const today = bucharestToday();
  const shift = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
  const dayList = ((dayRows ?? []) as { day: string }[]).map((d) => d.day);
  const activeDays30 = dayList.filter((d) => d >= shift(today, -29) && d <= today).length;
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const weekStart = shift(today, -dow);
  const viewList = (viewRows ?? []) as { resource_id: string; completed: boolean; last_viewed_at: string }[];
  const openedThisWeek = viewList.filter((v) => visibleById.has(v.resource_id) && bucharestToday(new Date(v.last_viewed_at)) >= weekStart).length;
  const goal = goalRow?.weekly_goal ?? 0;
  const goalPct = goal > 0 ? Math.min(100, Math.round((openedThisWeek / goal) * 100)) : 0;
  const totalVisible = visible.length;
  const totalDone = visible.filter((r) => doneIds.has(r.id)).length;
  const overallPct = totalVisible > 0 ? Math.round((totalDone / totalVisible) * 100) : 0;
  const byCat = new Map<string, number>();
  viewList.forEach((v) => {
    const r = visibleById.get(v.resource_id);
    if (r) byCat.set(r.category_id, (byCat.get(r.category_id) ?? 0) + 1);
  });
  const topCat = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCatName = topCat ? catName.get(topCat[0]) ?? "-" : "-";
  const ring = 2 * Math.PI * 34;
  const subtitle = [prof?.specialty, prof?.city].filter(Boolean).join(" · ");
  const dayLabel = (d: string) => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", { day: "numeric", month: "short" }).format(new Date(`${d}T00:00:00Z`)) + (dayList.includes(d) ? ` · ${tx("activ", "active")}` : "");

  const tile = "flex min-w-0 flex-col gap-1 rounded-card border border-line bg-surface px-5 py-5";
  const tiles: { label: string; value: React.ReactNode }[] = [
    { label: tx("Zile active, ultimele 30", "Active days, last 30"), value: <CountUp value={activeDays30} /> },
    { label: tx("Seria curentă", "Current streak"), value: <CountUp value={streak.current} /> },
    { label: tx("Cea mai lungă serie", "Longest streak"), value: <CountUp value={streak.longest} /> },
    { label: tx("Resurse deschise", "Resources opened"), value: <CountUp value={views.count ?? 0} /> },
    { label: tx("Comentarii", "Comments"), value: <CountUp value={comments.count ?? 0} /> },
    { label: tx("Favorite", "Favourites"), value: <CountUp value={favCount.count ?? 0} /> },
    { label: tx("Notițe", "Notes"), value: <CountUp value={(noteRows ?? []).length} /> },
    { label: tx("Categoria preferată", "Favourite category"), value: <span className="line-clamp-2 text-lg leading-snug">{topCatName}</span> },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <section className="relative isolate overflow-hidden bg-[#0a1f5c] text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_85%_0%,rgba(167,139,250,0.35),transparent_60%),linear-gradient(135deg,#0a1f5c,#2a1458)]" />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <div aria-hidden className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#0a1f5c] md:size-24 md:text-3xl">{initials}</div>
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-bold tracking-tight md:text-4xl">{name}</h1>
                {subtitle && <p className="mt-1 truncate text-white/80">{subtitle}</p>}
                <p className="mt-1 truncate text-sm text-white/65">{viewer.email}{prof?.created_at ? ` · ${tx("membru din", "member since")} ${fmt(prof.created_at)}` : ""}</p>
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags.map((g) => <span key={g.name} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{g.name}</span>)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-card bg-white/10 px-5 py-4">
              <svg viewBox="0 0 80 80" width="80" height="80" role="img" aria-label={tx(`Progres total ${overallPct}%`, `Overall progress ${overallPct}%`)} className="shrink-0 -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - overallPct / 100)} />
              </svg>
              <div>
                <p className="text-3xl font-bold leading-none">{overallPct}%</p>
                <p className="mt-1 text-sm text-white/75">{tx(`${totalDone} din ${totalVisible} resurse terminate`, `${totalDone} of ${totalVisible} resources completed`)}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {resumeRes && <Link href={`/resurse/${resumeRes.id}`} className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-[#0a1f5c] transition-colors hover:bg-white/90">{tx("Continuă lecția", "Continue lesson")}</Link>}
            <Link href="/profil?tab=setari#date" className="inline-flex h-11 items-center rounded-full border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">{tx("Editează profilul", "Edit profile")}</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
        <nav aria-label={tx("Secțiuni profil", "Profile sections")} className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-1 border-b border-line">
            {TABS.map((x) => (
              <li key={x.key}>
                <Link href={`/profil?tab=${x.key}`} scroll={false} aria-current={tab === x.key ? "page" : undefined} className={cn("relative flex h-12 items-center whitespace-nowrap px-4 text-sm font-semibold transition-colors", tab === x.key ? "text-ink" : "text-muted hover:text-ink")}>
                  {tx(x.ro, x.en)}
                  <span aria-hidden className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent transition-opacity", tab === x.key ? "opacity-100" : "opacity-0")} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {tab === "prezentare" && (
          <>
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {tiles.map((x) => (
                <div key={x.label} className={tile}>
                  <dd className="text-3xl font-bold leading-none">{x.value}</dd>
                  <dt className="text-xs leading-tight text-muted">{x.label}</dt>
                </div>
              ))}
            </dl>

            <div className="grid items-stretch gap-6 md:grid-cols-2">
              <Card className="flex flex-col gap-4 md:p-6">
                <div>
                  <h2 className="text-lg font-bold">{tx("Obiectiv săptămânal", "Weekly goal")}</h2>
                  <p className="mt-1 text-sm text-muted">{tx("Câte resurse vrei să deschizi în fiecare săptămână. Se resetează lunea.", "How many resources you want to open each week. Resets on Monday.")}</p>
                </div>
                {goal > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold">{tx(`${openedThisWeek} din ${goal} săptămâna aceasta`, `${openedThisWeek} of ${goal} this week`)}</span>
                      <span className="text-muted">{goalPct}%</span>
                    </div>
                    <div role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(openedThisWeek, goal)} aria-label={tx("Obiectiv săptămânal", "Weekly goal")} className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${goalPct}%` }} />
                    </div>
                    {goalPct >= 100 && <p className="text-sm font-semibold text-ok">{tx("Obiectiv atins. Bravo!", "Goal reached. Well done!")}</p>}
                  </div>
                )}
                <GoalForm current={goal} />
              </Card>

              <Card className="flex flex-col gap-3 md:p-6">
                <h2 className="text-lg font-bold">{tx("Continuă de unde ai rămas", "Continue where you left off")}</h2>
                {resumeRes ? (
                  <Link href={`/resurse/${resumeRes.id}`} className="group flex min-h-11 items-center gap-3 rounded-control">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold group-hover:text-accent">{pick(locale, resumeRes.title, resumeRes.title_en)}</span>
                      {catName.get(resumeRes.category_id) && <span className="text-sm text-muted">{catName.get(resumeRes.category_id)}</span>}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-accent">{tx("Deschide", "Open")}</span>
                  </Link>
                ) : (
                  <p className="text-sm text-muted">{tx("Deschide o resursă și o regăsești aici.", "Open a resource and you will find it here.")}</p>
                )}
                <div className="mt-auto border-t border-line pt-4">
                  <p className="text-sm text-muted">
                    {streak.current === 0
                      ? tx("Deschide o resursă azi ca să începi o serie.", "Open a resource today to start a streak.")
                      : streak.activeToday
                        ? tx("Ai fost activ și azi. Revino mâine ca să continui seria.", "You were active today too. Come back tomorrow to keep the streak.")
                        : tx("Deschide o resursă azi ca să continui seria.", "Open a resource today to keep your streak going.")}
                  </p>
                </div>
              </Card>
            </div>

            <Card className="flex flex-col gap-4 md:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">{tx("Activitate, ultimele 26 de săptămâni", "Activity, last 26 weeks")}</h2>
                <span className="text-sm text-muted">{tx(dayList.length === 1 ? "1 zi activă în total" : `${dayList.length} zile active în total`, `${dayList.length} active ${dayList.length === 1 ? "day" : "days"} in total`)}</span>
              </div>
              {dayList.length > 0 ? <ActivityMap days={dayList} today={today} label={dayLabel} /> : <p className="text-sm text-muted">{tx("Harta activității apare după prima resursă deschisă.", "Your activity map appears after you open your first resource.")}</p>}
            </Card>
          </>
        )}

        {tab === "progres" && (
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
                    <li key={c.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-semibold">{c.name}</span>
                        <FollowButton categoryId={c.id} initial={c.following} />
                      </div>
                      <div role="progressbar" aria-label={c.name} aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.done} className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted">{tx(`${c.done} din ${c.total} terminate`, `${c.done} of ${c.total} completed`)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}

        {tab === "favorite" && (
          <div className="grid items-start gap-6 md:grid-cols-2">
            <Card className="md:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold">{tx("Favorite recente", "Recent favourites")}</h2>
                {favorites.length > 0 && <Link href="/feed?fav=1" className="text-sm font-semibold text-accent hover:underline">{tx("Vezi toate", "View all")}</Link>}
              </div>
              {favorites.length === 0 ? (
                <p className="text-sm text-muted">{tx("Nu ai resurse favorite încă. Apasă inima de pe o resursă ca să o găsești rapid aici.", "You have no favourite resources yet. Tap the heart on a resource to find it quickly here.")}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {favorites.map((f) => (
                    <li key={f.id}><Link href={`/resurse/${f.id}`} className="block py-3 text-sm font-semibold hover:text-accent">{pick(locale, f.title, f.title_en)}</Link></li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="flex flex-col gap-4 md:p-6">
              <div>
                <h2 className="text-lg font-bold">{tx("Văzute recent", "Recently viewed")}</h2>
                <p className="mt-1 text-sm text-muted">{tx("Ultimele 20 de resurse deschise.", "The last 20 resources you opened.")}</p>
              </div>
              <LinkButton href="/recente" variant="secondary" className="self-start">{tx("Deschide lista", "Open list")}</LinkButton>
            </Card>
          </div>
        )}

        {tab === "notite" && (
          <Card className="md:p-6">
            <h2 className="text-lg font-bold">{tx("Notițele mele", "My notes")}</h2>
            <p className="mb-4 mt-1 text-sm text-muted">{tx("Notițele sunt private. Le scrii direct pe pagina fiecărei resurse.", "Notes are private. You write them directly on each resource page.")}</p>
            {(noteRows ?? []).length === 0 ? (
              <p className="text-sm text-muted">{tx("Nu ai notițe încă. Deschide o resursă și scrie prima notiță sub video.", "You have no notes yet. Open a resource and write your first note below the video.")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {((noteRows ?? []) as unknown as { body: string; updated_at: string; resources: { id: string; title: string; title_en: string | null } | null }[]).filter((n) => n.resources).map((n) => (
                  <li key={n.resources!.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
                    <Link href={`/resurse/${n.resources!.id}`} className="text-sm font-bold hover:text-accent">{pick(locale, n.resources!.title, n.resources!.title_en)}</Link>
                    <p className="line-clamp-3 whitespace-pre-line text-sm text-muted">{n.body}</p>
                    <span className="text-xs text-muted">{fmt(n.updated_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === "setari" && (
          <div className="grid items-start gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Card className="scroll-mt-24 md:p-6" id="date">
                <h2 className="mb-5 text-lg font-bold">{tx("Date personale", "Personal details")}</h2>
                <ProfileForm firstName={viewer.firstName} lastName={viewer.lastName} email={viewer.email} specialty={prof?.specialty ?? ""} city={prof?.city ?? ""} />
              </Card>
              <Card className="flex flex-col gap-4 md:p-6">
                <h2 className="text-lg font-bold">{tx("Schimbă adresa de email", "Change email address")}</h2>
                <EmailRequest email={viewer.email} />
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
            </div>
            <div className="flex flex-col gap-6">
              <Card className="flex flex-col gap-4 md:p-6">
                <div>
                  <h2 className="text-lg font-bold">{tx("Securitate", "Security")}</h2>
                  <p className="mt-1 text-sm text-muted">{tx("Alege o parolă nouă de cel puțin 10 caractere.", "Choose a new password of at least 10 characters.")}</p>
                </div>
                <LinkButton href="/setare-parola" variant="secondary" className="self-start">{t.profile.changePassword}</LinkButton>
              </Card>
              <Card className="flex flex-col gap-4 md:p-6">
                <h2 className="text-lg font-bold">{tx("Notificări pe telefon", "Phone notifications")}</h2>
                <PushToggle />
              </Card>
              <Devices userId={viewer.id} currentSession={viewer.sessionId} />
              <Card className="flex flex-col gap-4 md:p-6">
                <div>
                  <h2 className="text-lg font-bold">{tx("Datele mele", "My data")}</h2>
                  <p className="mt-1 text-sm text-muted">{tx("Descarcă tot ce păstrăm despre tine: profil, activitate, favorite, comentarii și notițe.", "Download everything we keep about you: profile, activity, favourites, comments and notes.")}</p>
                </div>
                <a href="/profil/export" download className={cn(btn.secondary, "self-start")}>{tx("Descarcă datele (JSON)", "Download my data (JSON)")}</a>
              </Card>
              <form action={logout} className="self-start">
                <button type="submit" className="min-h-11 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">{t.nav.logout}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
