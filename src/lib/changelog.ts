export type ChangelogEntry = { date: string; title: { ro: string; en: string }; text: { ro: string; en: string } };

// Newest first. Dates are ISO (YYYY-MM-DD).
export const changelog: ChangelogEntry[] = [
  {
    date: "2026-10-04",
    title: { ro: "Progres pe categorii", en: "Progress by category" },
    text: {
      ro: "În profil vezi câte resurse ai terminat în fiecare categorie, de unde poți continua și câte zile la rând ai fost activ.",
      en: "In your profile you can see how many resources you completed in each category, where to continue and how many days in a row you were active.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Urmărește categorii", en: "Follow categories" },
    text: {
      ro: "Urmărește categoriile care te interesează și primești notificări doar pentru resursele noi din ele. Răspunsurile la comentarii rămân mereu active.",
      en: "Follow the categories you care about and get notifications only for new resources in them. Replies to your comments always stay on.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Sondaje pe pagina principală", en: "Polls on the home page" },
    text: {
      ro: "Votează în sondajul curent direct din pagina principală și vezi imediat rezultatele comunității.",
      en: "Vote in the current poll right on the home page and see the community results straight away.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Videoclipuri populare", en: "Popular videos" },
    text: {
      ro: "Pe pagina principală găsești un rând cu cele mai vizionate videoclipuri.",
      en: "The home page now has a row with the most watched videos.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Notificări pentru răspunsuri", en: "Notifications for replies" },
    text: {
      ro: "Primești o notificare când cineva răspunde la comentariul tău, în clopoțel și pe pagina de notificări.",
      en: "You get a notification when someone replies to your comment, in the bell menu and on the notifications page.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Mod concentrare pentru articole", en: "Focus mode for articles" },
    text: {
      ro: "Citește articolele fără distrageri, cu text mai larg și fără elemente laterale.",
      en: "Read articles without distractions, with wider text and no side elements.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Temă luminoasă, întunecată sau automată", en: "Light, dark or automatic theme" },
    text: {
      ro: "Alege tema din meniul contului: luminoasă, întunecată sau în funcție de setările dispozitivului.",
      en: "Pick your theme from the account menu: light, dark or following your device settings.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Tur ghidat și meniul avatarului", en: "Guided tour and avatar menu" },
    text: {
      ro: "Un tur scurt îți arată principalele zone ale platformei. Din meniul avatarului ajungi rapid la profil, temă și ieșire din cont.",
      en: "A short tour shows you the main areas of the platform. The avatar menu gives quick access to your profile, theme and sign out.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Dispozitive conectate", en: "Connected devices" },
    text: {
      ro: "În profil vezi dispozitivele conectate și poți închide sesiunea de pe un singur dispozitiv.",
      en: "In your profile you can see your connected devices and sign out of a single device.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Profil cu specialitate și oraș", en: "Profile with speciality and city" },
    text: {
      ro: "Completează specialitatea și orașul în profil, ca să ne ajuți să îți oferim conținut potrivit.",
      en: "Add your speciality and city to your profile to help us offer you relevant content.",
    },
  },
  {
    date: "2026-10-04",
    title: { ro: "Platforma în limba engleză", en: "English version of the platform" },
    text: {
      ro: "Platforma poate fi folosită și în engleză. Schimbi limba oricând din comutatorul de limbă.",
      en: "The platform is now available in English. Change the language at any time with the language switch.",
    },
  },
];
