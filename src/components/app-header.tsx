import Link from "next/link";
import { getT, getTx } from "@/lib/i18n";
import { LangSwitch } from "@/components/lang-switch";
import { Wordmark } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";
import { HeaderShell } from "@/components/header-shell";
import { NotificationsPopup, SearchPopup } from "@/components/header-popups";
import { MegaNav, type MegaGroup, type MegaLink } from "@/components/mega-nav";
import { loadCommunity } from "@/lib/community";
import { Books, Question as QuestionIcon, EnvelopeSimple, GraduationCap, SquaresFour, CalendarBlank, BookOpen, UsersThree } from "@phosphor-icons/react/dist/ssr";


export async function AppHeader({ viewerId, isAdmin, unread = 0, initials = "?", name = "", email = "" }: { viewerId: string; isAdmin: boolean; unread?: number; initials?: string; name?: string; email?: string }) {
  const t = await getT();
  const tx = await getTx();
  const { categories, newByCategory, newTotal } = await loadCommunity(viewerId, isAdmin);
  const LEARN = ["webinarii", "studyclub-studii-de-caz", "resurse-si-formulare", "bookclub"];
  const COMMUNITY = ["discutii-generale", "intrebari-si-raspunsuri", "prezinta-te", "anunturi", "aventura-pe-munte"];
  const pick = (slugs: string[]) => slugs.map((s) => categories.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const HINTS: Record<string, [string, string]> = {
    "discutii-generale": ["Discuții generale și subiecte libere", "General discussions and open topics"],
    "anunturi": ["Noutăți și info oficiale", "News and official information"],
    "prezinta-te": ["Spune-ne cine ești", "Tell us who you are"],
    "intrebari-si-raspunsuri": ["Întreabă. Primește răspunsuri", "Ask. Get answers"],
    "webinarii": ["Înregistrările webinariilor, link-uri, idei și discuții", "Webinar recordings, links, ideas and discussions"],
    "studyclub-studii-de-caz": ["Cazuri reale. Lecții aplicate", "Real cases. Applied lessons"],
    "bookclub": ["Recomandări de lectură", "Reading recommendations"],
    "resurse-si-formulare": ["Documente utile și formulare pregătite de echipa MentorMed", "Useful documents and forms prepared by the MentorMed team"],
    "aventura-pe-munte": ["Ieși din cotidian, reconectează-te cu natura și cucerește noi vârfuri", "Break the routine, reconnect with nature and conquer new peaks"],
  };
  const catItem = (c: (typeof categories)[number]) => ({ href: `/feed?categorie=${c.slug}`, label: c.name, slug: c.slug, count: newByCategory[c.id] ?? 0, hint: HINTS[c.slug] ? tx(HINTS[c.slug][0], HINTS[c.slug][1]) : undefined });
  const groups: MegaGroup[] = [
    {
      id: "learn", label: tx("Învață", "Learn"), match: ["/recente", "/cursuri"], slugs: LEARN, columns: 2, count: pick(LEARN).reduce((n, c) => n + (newByCategory[c.id] ?? 0), 0),
      items: [
        ...pick(LEARN).map(catItem),
        { href: "/cursuri", label: tx("Cursuri premium", "Premium courses"), icon: <GraduationCap size={18} />, hint: tx("Cursuri avansate, cu reducere pentru membri", "Advanced courses, member discount") },
        { href: "/feed", label: tx("Toate resursele", "All resources"), icon: <SquaresFour size={18} />, count: newTotal },
      ],
    },
    { id: "community", label: tx("Comunitate", "Community"), match: ["/colectii"], slugs: COMMUNITY, columns: 2,
      items: [
        ...pick(COMMUNITY.slice(0, 4)).map(catItem),
        { href: "/colectii", label: tx("Colecții", "Collections"), icon: <Books size={18} />, hint: tx("Parcursuri ordonate de studiu", "Ordered study paths") },
        ...pick(COMMUNITY.slice(4)).map(catItem),
      ],
    },
    {
      id: "events", label: tx("Evenimente", "Events"), match: ["/evenimente", "/eveniment"], columns: 1,
      items: [
        { href: "/evenimente/studyclub", label: "StudyClub", icon: <CalendarBlank size={18} />, hint: tx("Cazuri clinice și protocoale, lunar online", "Clinical cases and protocols, monthly online") },
        { href: "/evenimente/bookclub", label: "BookClub", icon: <BookOpen size={18} />, hint: tx("Medicina dentară prin lectură", "Dentistry through reading") },
        { href: "/evenimente/mentormed", label: tx("Evenimente MentorMed", "MentorMed events"), icon: <UsersThree size={18} />, hint: tx("Întâlniri fizice, precum SuperBootcamp", "In-person meetings, such as the SuperBootcamp") },
      ],
    },
    {
      id: "help", label: tx("Ajutor", "Help"), match: ["/faq", "/contact"], columns: 1,
      items: [
        { href: "/faq", label: tx("Întrebări frecvente", "FAQ"), icon: <QuestionIcon size={18} /> },
        { href: "/contact", label: tx("Contact", "Contact"), icon: <EnvelopeSimple size={18} /> },
      ],
    },
  ];
  const links: MegaLink[] = [
    ...(isAdmin ? [{ href: "/admin", label: t.nav.admin, match: ["/admin"] }] : []),
  ];
  return (
    <HeaderShell>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="relative flex h-[53px] items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Link href="/feed" aria-label={t.brand} className="shrink-0">
              <Wordmark />
            </Link>
            <div className="md:ml-4"><MegaNav groups={groups} links={links} /></div>
          </div>
          <div className="flex items-center">
            <LangSwitch className="mr-1" />
            <SearchPopup />
            <NotificationsPopup unread={unread} />
            <UserMenu initials={initials} name={name} email={email} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}
